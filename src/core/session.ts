// The bundles of one exploration, held open by the core, and the questions the interface asks
// about them. It runs in the core's worker.

import { type Dependency, dependencies, isDependency } from "./dependencies";
import {
  type Address,
  type Entry,
  type External,
  isBundleFile,
  keyOf,
  type ObjectDocument,
  references,
  resolve,
  type UnityObject,
} from "./documents";
import { type Link, Links } from "./links";
import { type Direction, type Drawing, Units } from "./units";

/** What the library lists about an object: everything but its fields. */
export type ObjectSummary = {
  id: string;
  class: string;
  classId: number;
  name?: string;
  script?: string | null;
  container?: string[];
  size: number;
  error?: string;
};

export type FileSummary = {
  path: string;
  unityVersion: string;
  serializedVersion: number;
  typeTrees: boolean;
  externals: External[];
  objects: ObjectSummary[];
};

export type BundleSummary = { name: string; entries: Entry[]; files: FileSummary[] };

/** A bundle the core could not read, with the reason it gave. */
export type Failure = { bundle: string; reason: string };

export type Library = { bundles: BundleSummary[]; failures: Failure[] };

/** An asset a bundle plans: its name, its form, and the object or file it starts at. */
export type PlannedAsset = { name: string; form: string; path_id?: string; file?: string };

/** An object an asset is made from, as asset documents list it. */
export type SourceObject = { bundle: string; file?: string; path_id: string; class: string };

/** A file of an asset. */
export type Member = {
  role: string;
  sha256: string;
  size: number;
  extension: string;
  media_type?: string;
};

/** What an asset is, as the core writes it once it has converted the asset. */
export type AssetDocument = {
  name: string;
  form: string;
  form_version: number;
  fingerprint: string;
  sources: SourceObject[];
  resources?: { bundle: string; file: string }[];
  members: Member[];
  references: string[];
  error?: { code: string; message: string };
};

/** The core's session over a set of bundles, as its class `Explorer` offers it. */
export type Explorer = {
  bundles(): string[];
  failed(): string;
  document(bundle: string, onPayload: (sha256: string, bytes: Uint8Array) => void): Uint8Array;
  assets(bundle: string): string;
  convert(name: string): Uint8Array | undefined;
  closure(name: string): string | undefined;
  file(name: string): Uint8Array;
};

const text = new TextDecoder();
const json = <T>(bytes: Uint8Array): T => JSON.parse(text.decode(bytes));

export class Session {
  readonly library: Library;
  readonly #core: Explorer;
  readonly #objects = new Map<string, UnityObject>();
  readonly #links = new Links();
  readonly #payloads = new Map<string, Uint8Array>();
  /** The dependencies the AssetBundle object of each bundle lists. */
  readonly #declared = new Map<string, string[]>();
  #units: Units | undefined;

  /** Reads the object document of every bundle `core` holds. */
  constructor(core: Explorer) {
    this.#core = core;
    const documents = core
      .bundles()
      .map((bundle) =>
        json<ObjectDocument>(
          core.document(bundle, (sha256, bytes) => this.#payloads.set(sha256, bytes)),
        ),
      );
    const open = new Set(documents.map((document) => document.bundle));
    for (const document of documents) this.#load(document, open);
    const failures: [string, string][] = JSON.parse(core.failed());
    this.library = {
      bundles: documents.map(summary),
      failures: failures.map(([bundle, reason]) => ({ bundle, reason })),
    };
  }

  object(address: Address): UnityObject | undefined {
    return this.#objects.get(keyOf(address));
  }

  /** The references made to `address`. */
  referrers(address: Address): Link[] {
    return this.#links.to(address);
  }

  /** The units at most `depth` ties from the unit of `center`, at most `limit` of them. */
  around(center: Address, direction: Direction, depth: number, limit: number): Drawing {
    return this.#drawn().around(center, direction, depth, limit);
  }

  /** The units that hold `objects`, and the ties among them. */
  gather(objects: Address[]): Drawing {
    return this.#drawn().gather(objects);
  }

  /** The bundles each open bundle depends on. */
  dependencies(): Dependency[] {
    return dependencies(this.#links.all(), this.#declared, (address) => this.#classOf(address));
  }

  /** The references objects of the bundle `from` make to objects of the bundle `to`. */
  between(from: string, to: string): Link[] {
    return [...this.#links.all()].filter(
      (link) =>
        link.from.bundle === from &&
        link.to.bundle === to &&
        isDependency(link, (address) => this.#classOf(address)),
    );
  }

  /** A byte payload too large to be written inline, by its SHA-256. */
  payload(sha256: string): Uint8Array | undefined {
    return this.#payloads.get(sha256);
  }

  assets(bundle: string): PlannedAsset[] {
    return JSON.parse(this.#core.assets(bundle));
  }

  /** The asset `name`, converted if it has not been; `null` when its root holds none. */
  convert(name: string): AssetDocument | null {
    const document = this.#core.convert(name);
    return document ? json(document) : null;
  }

  /** The objects converting the asset `name` may read, its root first. */
  closure(name: string): SourceObject[] {
    const closure = this.#core.closure(name);
    return closure ? JSON.parse(closure) : [];
  }

  /** A file of a converted asset. */
  member(member: Member): Uint8Array {
    return this.#core.file(`${member.sha256}.${member.extension}`);
  }

  /** The objects as units, worked out the first time a drawing is asked for. */
  #drawn(): Units {
    this.#units ??= new Units(this.#links.all(), (address) => this.#classOf(address));
    return this.#units;
  }

  #classOf(address: Address): string | undefined {
    return this.#objects.get(keyOf(address))?.class;
  }

  /** Keeps the objects of `document` and indexes their references; `open` names every bundle. */
  #load(document: ObjectDocument, open: ReadonlySet<string>) {
    const declared = declaredDependencies(document);
    this.#declared.set(document.bundle, declared);
    const unopened = unopenedFiles(
      document,
      declared.filter((name) => !open.has(name)),
    );
    for (const file of document.files) {
      for (const object of file.objects) {
        const address = { bundle: document.bundle, file: file.path, id: object.id };
        this.#objects.set(keyOf(address), object);
        this.#index(address, object, unopened);
      }
    }
  }

  /**
   * Indexes the references of `object`, with those into files no open bundle holds placed where
   * `unopened` says. References to engine resources are left out.
   */
  #index(from: Address, object: UnityObject, unopened: Map<string, FileAt>) {
    if (object.fields === null) return;
    for (const [field, reference] of references(object.fields)) {
      const target = resolve(reference, from);
      const file = "external" in target ? unopened.get(target.external) : undefined;
      const to = "address" in target ? target.address : file && { ...file, id: target.id };
      if (to) this.#links.add({ from, to, field });
    }
  }
}

/** A serialized file of a bundle. */
type FileAt = NonNullable<External["target"]>;

/**
 * Where each file of another bundle that `document` refers to, and no open bundle holds, lives.
 * When the document declares exactly one dependency that is not open and refers to exactly one
 * such file, the file is that bundle's; otherwise the file stands for its bundle under its own name.
 */
function unopenedFiles(document: ObjectDocument, unopened: string[]): Map<string, FileAt> {
  const paths = new Set(
    document.files
      .flatMap((file) => file.externals)
      .filter((external) => external.target === null && isBundleFile(external.path))
      .map((external) => external.path),
  );
  const named = paths.size === 1 && unopened.length === 1 ? unopened[0] : undefined;
  return new Map(
    [...paths].map((path) => {
      const file = path.slice(path.lastIndexOf("/") + 1);
      return [path, { bundle: named ?? file, file }];
    }),
  );
}

/** The bundle names the AssetBundle object of `document` lists in `m_Dependencies`. */
function declaredDependencies(document: ObjectDocument): string[] {
  const object = document.files
    .flatMap((file) => file.objects)
    .find((each) => each.class === "AssetBundle");
  const fields = object?.fields;
  const listed =
    fields && typeof fields === "object" && !Array.isArray(fields) && "m_Dependencies" in fields
      ? fields.m_Dependencies
      : undefined;
  return Array.isArray(listed) ? listed.filter((name) => typeof name === "string") : [];
}

function summary(document: ObjectDocument): BundleSummary {
  return {
    name: document.bundle,
    entries: document.entries,
    files: document.files.map((file) => ({
      path: file.path,
      unityVersion: file.unity_version,
      serializedVersion: file.serialized_version,
      typeTrees: file.type_trees,
      externals: file.externals,
      objects: file.objects.map((object) => ({
        id: object.id,
        class: object.class,
        classId: object.class_id,
        name: object.name,
        script: object.script,
        container: object.container,
        size: object.size,
        error: object.error?.code,
      })),
    })),
  };
}

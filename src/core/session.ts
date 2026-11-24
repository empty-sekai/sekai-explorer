// The bundles of one exploration, held open by the core, and the questions the interface asks
// about them. It runs in the core's worker.

import {
  type Address,
  type Entry,
  type External,
  keyOf,
  type ObjectDocument,
  references,
  resolve,
  type UnityObject,
} from "./documents";
import { type Graph, type Link, Links } from "./links";

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
    for (const document of documents) {
      for (const file of document.files) {
        for (const object of file.objects) {
          const address = { bundle: document.bundle, file: file.path, id: object.id };
          this.#objects.set(keyOf(address), object);
          this.#index(address, object);
        }
      }
    }
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

  /** The objects at most `depth` references from `center`, either way, at most `limit`. */
  near(center: Address, depth: number, limit: number): Graph {
    return this.#links.near(center, depth, limit);
  }

  /** The references among `objects`. */
  among(objects: Address[]): Link[] {
    return this.#links.among(objects);
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

  #index(from: Address, object: UnityObject) {
    if (object.fields === null) return;
    for (const [field, reference] of references(object.fields)) {
      const target = resolve(reference, from);
      if (!("address" in target)) continue;
      this.#links.add({ from, to: target.address, field });
    }
  }
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

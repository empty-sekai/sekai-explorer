// The bundles of one exploration, read by the core, and the questions the interface asks about
// them. It runs in the core's worker.

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

/** An object that refers to another, and the field it does so in. */
export type Referrer = { from: Address; field: string };

export type Bundle = { name: string; bytes: Uint8Array };

/** The `objects` function of the core: object documents of bundles given as names and bytes. */
export type ObjectsFunction = (
  names: string[],
  bundles: Uint8Array[],
  onFile: (path: string, bytes: Uint8Array) => void,
) => string;

const DOCUMENT = "/_objects.json";

export class Session {
  readonly library: Library;
  readonly #objects = new Map<string, UnityObject>();
  readonly #referrers = new Map<string, Referrer[]>();
  readonly #payloads: Map<string, Uint8Array>;

  /** Reads `bundles` with the core's `objects` function. */
  static read(objects: ObjectsFunction, bundles: Bundle[]): Session {
    const documents: ObjectDocument[] = [];
    const payloads = new Map<string, Uint8Array>();
    const text = new TextDecoder();
    const failed = objects(
      bundles.map((bundle) => bundle.name),
      bundles.map((bundle) => bundle.bytes),
      (path, bytes) => {
        if (path.endsWith(DOCUMENT)) {
          documents.push(JSON.parse(text.decode(bytes)));
        } else {
          payloads.set(path.slice(path.lastIndexOf("/") + 1, -".bin".length), bytes);
        }
      },
    );
    return new Session(documents, payloads, failures(failed));
  }

  private constructor(
    documents: ObjectDocument[],
    payloads: Map<string, Uint8Array>,
    failures: Failure[],
  ) {
    this.#payloads = payloads;
    for (const document of documents) {
      for (const file of document.files) {
        for (const object of file.objects) {
          const address = { bundle: document.bundle, file: file.path, id: object.id };
          this.#objects.set(keyOf(address), object);
          this.#index(address, object);
        }
      }
    }
    this.library = { bundles: documents.map(summary), failures };
  }

  object(address: Address): UnityObject | undefined {
    return this.#objects.get(keyOf(address));
  }

  referrers(address: Address): Referrer[] {
    return this.#referrers.get(keyOf(address)) ?? [];
  }

  /** A byte payload too large to be written inline, by its SHA-256. */
  payload(sha256: string): Uint8Array | undefined {
    return this.#payloads.get(sha256);
  }

  #index(from: Address, object: UnityObject) {
    if (object.fields === null) return;
    for (const [field, reference] of references(object.fields)) {
      const target = resolve(reference, from);
      if (!("address" in target)) continue;
      const key = keyOf(target.address);
      const list = this.#referrers.get(key);
      if (list) list.push({ from, field });
      else this.#referrers.set(key, [{ from, field }]);
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

/** The failures the core reports, one `<bundle>\t<reason>` line each. */
function failures(lines: string): Failure[] {
  return lines
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      const tab = line.indexOf("\t");
      return { bundle: line.slice(0, tab), reason: line.slice(tab + 1) };
    });
}

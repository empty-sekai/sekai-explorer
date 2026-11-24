// The object document format of sekai-exporter (docs/spec/object-documents.md, version 1),
// and how its references resolve to objects.

export type ObjectDocument = {
  format: "objects";
  version: 1;
  bundle: string;
  entries: Entry[];
  files: SerializedFile[];
};

export type Entry = {
  path: string;
  kind: "serialized" | "resource";
  size: number;
  sha256: string;
};

export type SerializedFile = {
  path: string;
  serialized_version: number;
  unity_version: string;
  platform: number;
  type_trees: boolean;
  externals: External[];
  objects: UnityObject[];
};

export type External = {
  index: number;
  path: string;
  target: { bundle: string; file: string } | null;
};

export type UnityObject = {
  id: string;
  class: string;
  class_id: number;
  script?: string | null;
  name?: string;
  container?: string[];
  size: number;
  sha256: string;
  fields: Value | null;
  error?: { code: string; message: string };
  raw?: Bytes;
};

export type Bytes = { $bytes: { size: number; sha256: string; base64?: string } };

export type Reference = {
  $ref: { id: string; file?: string; bundle?: string; external?: string };
};

export type Value =
  | null
  | boolean
  | number
  | string
  | Value[]
  | Bytes
  | Reference
  | { [field: string]: Value };

export function isBytes(value: Value): value is Bytes {
  return typeof value === "object" && value !== null && "$bytes" in value;
}

export function isReference(value: Value): value is Reference {
  return typeof value === "object" && value !== null && "$ref" in value;
}

/** Where an object lives: its bundle, serialized file and path ID. */
export type Address = { bundle: string; file: string; id: string };

/** What a reference points to: an object of a bundle, or an object of an engine external. */
export type Target = { address: Address } | { external: string; id: string };

/** The object a reference written in `from`'s file points to. */
export function resolve(reference: Reference, from: Address): Target {
  const { id, file, bundle, external } = reference.$ref;
  if (external !== undefined) return { external, id };
  return { address: { bundle: bundle ?? from.bundle, file: file ?? from.file, id } };
}

/** A key that identifies an address, for maps and caches. */
export function keyOf(address: Address): string {
  return `${address.bundle}\n${address.file}\n${address.id}`;
}

/** Every reference inside `value`, with the field path it is stored at. */
export function* references(value: Value, path = ""): Generator<[string, Reference]> {
  if (typeof value !== "object" || value === null || isBytes(value)) return;
  if (isReference(value)) {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* references(item, `${path}[${i}]`);
  } else {
    for (const [name, field] of Object.entries(value)) {
      yield* references(field, path === "" ? name : `${path}.${name}`);
    }
  }
}

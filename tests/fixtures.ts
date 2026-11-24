// A small synthetic object document: a GameObject with a Transform and a renderer that uses a
// material of another bundle.

import type { ObjectDocument, SerializedFile, UnityObject } from "~/core/documents";
import type { Explorer } from "~/core/session";

const object = (
  id: string,
  cls: string,
  fields: UnityObject["fields"],
  name?: string,
): UnityObject => ({
  id,
  class: cls,
  class_id: 0,
  name,
  size: 16,
  sha256: "00".repeat(32),
  fields,
});

const file = (
  path: string,
  objects: UnityObject[],
  externals: SerializedFile["externals"] = [],
): SerializedFile => ({
  path,
  serialized_version: 22,
  unity_version: "2022.3.0f1",
  platform: 13,
  type_trees: true,
  externals,
  objects,
});

export const model: ObjectDocument = {
  format: "objects",
  version: 1,
  bundle: "model/body",
  entries: [{ path: "CAB-a", kind: "serialized", size: 100, sha256: "11".repeat(32) }],
  files: [
    file(
      "CAB-a",
      [
        object(
          "1",
          "GameObject",
          { m_Name: "body", m_Component: [{ component: { $ref: { id: "2" } } }] },
          "body",
        ),
        object("2", "Transform", { m_GameObject: { $ref: { id: "1" } }, m_Father: null }),
        object("3", "MeshRenderer", {
          m_GameObject: { $ref: { id: "1" } },
          m_Materials: [{ $ref: { bundle: "shader/common", file: "CAB-b", id: "9" } }],
        }),
      ],
      [
        {
          index: 1,
          path: "archive:/CAB-b/CAB-b",
          target: { bundle: "shader/common", file: "CAB-b" },
        },
      ],
    ),
  ],
};

export const shader: ObjectDocument = {
  format: "objects",
  version: 1,
  bundle: "shader/common",
  entries: [{ path: "CAB-b", kind: "serialized", size: 50, sha256: "22".repeat(32) }],
  files: [file("CAB-b", [object("9", "Material", { m_Name: "skin" }, "skin")])],
};

/** A stand-in for the core's session over `documents`, with one payload and the given failures. */
export function core(documents: ObjectDocument[], failures: [string, string][] = []): Explorer {
  const text = new TextEncoder();
  return {
    bundles: () => documents.map((document) => document.bundle),
    failed: () => JSON.stringify(failures),
    document(bundle, onPayload) {
      onPayload("abcd", new Uint8Array([1, 2, 3]));
      const document = documents.find((d) => d.bundle === bundle);
      return text.encode(JSON.stringify(document));
    },
    assets: () => JSON.stringify([{ name: "a/b", form: "texture", path_id: "1" }]),
    convert: () => undefined,
    closure: () => undefined,
    file: () => new Uint8Array(),
  };
}

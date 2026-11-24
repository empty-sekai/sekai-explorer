import { expect, test } from "vitest";
import type { ObjectDocument } from "~/core/documents";
import { type ObjectsFunction, Session } from "~/core/session";
import { model, shader } from "./fixtures";

/** A stand-in for the core that writes the given documents and reports one failure. */
function core(documents: ObjectDocument[]): ObjectsFunction {
  const text = new TextEncoder();
  return (_names, _bundles, onFile) => {
    for (const document of documents) {
      onFile(`${document.bundle}/_objects.json`, text.encode(JSON.stringify(document)));
    }
    onFile("_payloads/ab/abcd.bin", new Uint8Array([1, 2, 3]));
    return "broken\tobfuscation\n";
  };
}

const session = Session.read(core([model, shader]), []);

test("summarises bundles without their fields", () => {
  const [bundle] = session.library.bundles;
  expect(bundle?.files[0]?.objects.map((object) => object.class)).toEqual([
    "GameObject",
    "Transform",
    "MeshRenderer",
  ]);
  expect(session.library.failures).toEqual([{ bundle: "broken", reason: "obfuscation" }]);
});

test("finds who refers to an object, across bundles, with the field", () => {
  expect(session.referrers({ bundle: "model/body", file: "CAB-a", id: "1" })).toEqual([
    { from: { bundle: "model/body", file: "CAB-a", id: "2" }, field: "m_GameObject" },
    { from: { bundle: "model/body", file: "CAB-a", id: "3" }, field: "m_GameObject" },
  ]);
  expect(session.referrers({ bundle: "shader/common", file: "CAB-b", id: "9" })).toEqual([
    { from: { bundle: "model/body", file: "CAB-a", id: "3" }, field: "m_Materials[0]" },
  ]);
});

test("keeps payloads by hash", () => {
  expect(session.payload("abcd")).toEqual(new Uint8Array([1, 2, 3]));
});

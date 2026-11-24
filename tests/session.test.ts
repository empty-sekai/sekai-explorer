import { expect, test } from "vitest";
import { Session } from "~/core/session";
import { core, model, shader } from "./fixtures";

const session = new Session(core([model, shader], [["broken", "obfuscation"]]));

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

test("lists the assets a bundle plans", () => {
  expect(session.assets("model")).toEqual([{ name: "a/b", form: "texture", path_id: "1" }]);
  expect(session.convert("a/b")).toBeNull();
});

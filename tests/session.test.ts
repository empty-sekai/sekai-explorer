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

const body = (id: string) => ({ bundle: "model/body", file: "CAB-a", id });
const material = { bundle: "shader/common", file: "CAB-b", id: "9" };

test("finds who refers to an object, across bundles, with the field", () => {
  expect(session.referrers(body("1"))).toEqual([
    { from: body("2"), to: body("1"), field: "m_GameObject" },
    { from: body("3"), to: body("1"), field: "m_GameObject" },
  ]);
  expect(session.referrers(material)).toEqual([
    { from: body("3"), to: material, field: "m_Materials[0]" },
  ]);
});

test("draws the objects near one, and the references among a set", () => {
  const near = session.near(material, 2, 100);
  expect(near.objects).toEqual([material, body("3"), body("1")]);
  expect(near.truncated).toBe(false);
  expect(session.among([body("3"), material]).map((link) => link.field)).toEqual([
    "m_Materials[0]",
  ]);
});

test("keeps payloads by hash", () => {
  expect(session.payload("abcd")).toEqual(new Uint8Array([1, 2, 3]));
});

test("lists the assets a bundle plans", () => {
  expect(session.assets("model")).toEqual([{ name: "a/b", form: "texture", path_id: "1" }]);
  expect(session.convert("a/b")).toBeNull();
});

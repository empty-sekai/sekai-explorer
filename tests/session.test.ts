import { expect, test } from "vitest";
import { Session } from "~/core/session";
import { core, file, model, object, shader } from "./fixtures";

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

test("draws a GameObject with what it uses, across bundles", () => {
  const drawing = session.around(body("3"), "uses", 1, 100);
  expect(drawing.units.map((unit) => unit.address)).toEqual([body("1"), material]);
  expect(drawing.ties.map((tie) => tie.fields)).toEqual([["m_Materials[0]"]]);
});

test("lists the bundles a bundle depends on", () => {
  expect(session.dependencies()).toEqual([
    {
      from: "model/body",
      to: "shader/common",
      declared: false,
      count: 1,
      lists: [["m_Materials[]", 1]],
    },
  ]);
  expect(session.between("model/body", "shader/common").map((link) => link.field)).toEqual([
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

test("places references into a bundle that is not open under the dependency it declares", () => {
  const external = "archive:/CAB-z/CAB-z";
  const cake = new Session(
    core([
      {
        format: "objects",
        version: 1,
        bundle: "fixture/cake",
        entries: [],
        files: [
          file(
            "CAB-c",
            [
              object("1", "AssetBundle", { m_Dependencies: ["effect/candle"] }),
              object("2", "ParticleSystem", { m_Effect: { $ref: { external, id: "5" } } }),
            ],
            [{ index: 1, path: external, target: null }],
          ),
        ],
      },
    ]),
  );
  expect(cake.dependencies()).toEqual([
    {
      from: "fixture/cake",
      to: "effect/candle",
      declared: true,
      count: 1,
      lists: [["m_Effect", 1]],
    },
  ]);
});

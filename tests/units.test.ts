import { expect, test } from "vitest";
import type { Address } from "~/core/documents";
import type { Link } from "~/core/links";
import { Units } from "~/core/units";

// A parent GameObject with a child, whose renderer uses a material of another bundle and names
// fourteen bones; and the AssetBundle object, which lists every object.
const at = (id: string, bundle = "model"): Address => ({ bundle, file: "CAB", id });
const classes = new Map<string, string>([["bundle", "AssetBundle"]]);
const links: Link[] = [];
const link = (from: string, to: Address, field: string) =>
  links.push({ from: at(from), to, field });
const gameObject = (name: string, transform: string) => {
  classes.set(name, "GameObject");
  classes.set(transform, "Transform");
  link(name, at(transform), "m_Component[0].component");
  link(transform, at(name), "m_GameObject");
};
gameObject("parent", "parentTransform");
gameObject("child", "childTransform");
link("parentTransform", at("childTransform"), "m_Children[0]");
link("childTransform", at("parentTransform"), "m_Father");
link("child", at("renderer"), "m_Component[1].component");
link("renderer", at("child"), "m_GameObject");
link("renderer", at("skin", "shader"), "m_Materials[0]");
for (let i = 0; i < 14; i++) {
  gameObject(`bone${i}`, `boneTransform${i}`);
  link("renderer", at(`boneTransform${i}`), `m_Bones[${i}]`);
}
for (const [i, id] of ["parent", "child", "renderer"].entries()) {
  link("bundle", at(id), `m_PreloadTable[${i}]`);
}

const units = new Units(links, (address) => classes.get(address.id));
const ids = (drawing: { units: { address: Address }[] }) =>
  drawing.units.map((unit) => unit.address.id).sort();

test("draws a GameObject with its components, its children, and what it uses", () => {
  const drawing = units.around(at("parent"), "uses", 64, 100);
  expect(ids(drawing)).toEqual(["child", "parent", "skin"]);
  expect(drawing.ties.map(({ kind, fields }) => [kind, fields])).toEqual([
    ["child", ["m_Children[0]"]],
    ["use", ["m_Materials[0]"]],
  ]);
});

test("notes a long list on its unit instead of drawing it", () => {
  const child = units.gather([at("renderer")]).units[0];
  expect(child?.components.map((address) => address.id)).toEqual(["childTransform", "renderer"]);
  expect(child?.lists).toEqual([{ field: "m_Bones[]", count: 14 }]);
});

test("follows what uses an object the other way", () => {
  expect(ids(units.around(at("skin", "shader"), "users", 1, 100))).toEqual(["child", "skin"]);
});

test("stops at the limit and says so", () => {
  const drawing = units.around(at("parent"), "uses", 64, 2);
  expect(drawing.units).toHaveLength(2);
  expect(drawing.truncated).toBe(true);
});

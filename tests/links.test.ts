import { expect, test } from "vitest";
import type { Address } from "~/core/documents";
import { Links } from "~/core/links";

const at = (id: string): Address => ({ bundle: "b", file: "f", id });

// a → b → c → d, and e → b
const links = new Links();
for (const pair of ["ab", "bc", "cd", "eb"]) {
  const [from = "", to = ""] = pair;
  links.add({ from: at(from), to: at(to), field: `${from}.${to}` });
}

const ids = (addresses: Address[]) => addresses.map((address) => address.id).sort();

test("follows references both ways, as far as asked", () => {
  expect(ids(links.near(at("b"), 1, 100).objects)).toEqual(["a", "b", "c", "e"]);
  expect(ids(links.near(at("b"), 2, 100).objects)).toEqual(["a", "b", "c", "d", "e"]);
});

test("keeps the references among what it found", () => {
  const near = links.near(at("b"), 1, 100);
  expect(near.links.map((link) => link.field).sort()).toEqual(["a.b", "b.c", "e.b"]);
  expect(near.truncated).toBe(false);
});

test("stops at the limit and says so", () => {
  const near = links.near(at("b"), 2, 2);
  expect(near.objects).toHaveLength(2);
  expect(near.truncated).toBe(true);
});

test("finds the references among a set", () => {
  expect(links.among([at("a"), at("b"), at("d")]).map((link) => link.field)).toEqual(["a.b"]);
});

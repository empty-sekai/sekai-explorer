import { expect, test } from "vitest";
import { Catalog } from "~/core/catalog";
import { search } from "~/core/search";
import { Session } from "~/core/session";
import { rows } from "~/library/rows";
import { model, shader } from "./fixtures";

const text = new TextEncoder();
const session = Session.read((_n, _b, onFile) => {
  for (const d of [model, shader])
    onFile(`${d.bundle}/_objects.json`, text.encode(JSON.stringify(d)));
  return "";
}, []);
const catalog = new Catalog(session.library);

test("lists closed bundles, and the objects of open ones", () => {
  const closed = rows(catalog.library.bundles, new Set(), "");
  expect(closed.map((row) => row.kind)).toEqual(["bundle", "bundle"]);
  const open = rows(catalog.library.bundles, new Set(["model/body"]), "");
  expect(open.map((row) => row.kind)).toEqual(["bundle", "object", "object", "object", "bundle"]);
});

test("a filter opens the bundles whose objects match", () => {
  const filtered = rows(catalog.library.bundles, new Set(), "material");
  expect(filtered.map((row) => (row.kind === "bundle" ? row.bundle.name : row.kind))).toEqual([
    "shader/common",
    "object",
  ]);
});

test("search puts exact names first", () => {
  const found = search(catalog, "skin", 10);
  expect(found.objects.map(({ object }) => object.name)).toEqual(["skin"]);
  expect(search(catalog, "shader", 10).bundles.map((b) => b.name)).toEqual(["shader/common"]);
});

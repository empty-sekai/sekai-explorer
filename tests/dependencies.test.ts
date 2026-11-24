import { expect, test } from "vitest";
import { dependencies } from "~/core/dependencies";
import type { Address } from "~/core/documents";

const at = (bundle: string, id: string): Address => ({ bundle, file: "CAB", id });

test("counts references between bundles by list, beside the declared dependencies", () => {
  const links = [
    { from: at("model", "1"), to: at("shader", "9"), field: "m_Materials[0]" },
    { from: at("model", "2"), to: at("shader", "9"), field: "m_Materials[1]" },
    { from: at("model", "3"), to: at("model", "1"), field: "m_GameObject" },
    { from: at("model", "bundle"), to: at("shader", "9"), field: "m_PreloadTable[0]" },
  ];
  const declared = new Map([["model", ["shader", "effect"]]]);
  const classOf = (address: Address) => (address.id === "bundle" ? "AssetBundle" : "Object");
  expect(dependencies(links, declared, classOf)).toEqual([
    { from: "model", to: "shader", declared: true, count: 2, lists: [["m_Materials[]", 2]] },
    { from: "model", to: "effect", declared: true, count: 0, lists: [] },
  ]);
});

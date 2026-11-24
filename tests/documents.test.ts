import { describe, expect, test } from "vitest";
import { references, resolve } from "~/core/documents";

describe("references", () => {
  test("lists every reference with its field path", () => {
    const fields = {
      a: { $ref: { id: "1" } },
      list: [null, { b: { $ref: { id: "2", file: "F" } } }],
    };
    expect([...references(fields)].map(([path]) => path)).toEqual(["a", "list[1].b"]);
  });

  test("does not look inside byte payloads", () => {
    expect([...references({ data: { $bytes: { size: 0, sha256: "" } } })]).toEqual([]);
  });
});

describe("resolve", () => {
  const from = { bundle: "B", file: "F", id: "0" };
  test("fills in the bundle and file of the referring object", () => {
    expect(resolve({ $ref: { id: "7" } }, from)).toEqual({
      address: { bundle: "B", file: "F", id: "7" },
    });
    expect(resolve({ $ref: { id: "7", file: "G" } }, from)).toEqual({
      address: { bundle: "B", file: "G", id: "7" },
    });
  });

  test("keeps externals that resolve to no bundle apart", () => {
    expect(
      resolve({ $ref: { id: "7", external: "Library/unity default resources" } }, from),
    ).toEqual({
      external: "Library/unity default resources",
      id: "7",
    });
  });
});

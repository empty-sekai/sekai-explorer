// The library as a flat list of rows, so that tens of thousands of objects scroll smoothly.

import type { Address } from "~/core/documents";
import type { BundleSummary, ObjectSummary } from "~/core/session";

export type Row =
  | { kind: "bundle"; bundle: BundleSummary; open: boolean; objects: number }
  | { kind: "file"; path: string }
  | { kind: "object"; address: Address; object: ObjectSummary };

/**
 * The rows of `bundles`: each bundle, and below an open one its objects, under the name of their
 * serialized file when the bundle has several. With a `filter`, only bundles whose name matches,
 * or that hold objects that match, are listed; a bundle opened by its objects shows only those.
 */
export function rows(bundles: BundleSummary[], open: Set<string>, filter: string): Row[] {
  const needle = filter.trim().toLowerCase();
  const list: Row[] = [];
  for (const bundle of bundles) {
    const named = needle === "" || bundle.name.toLowerCase().includes(needle);
    const files = bundle.files.map((file) => ({
      path: file.path,
      objects: named ? file.objects : file.objects.filter((object) => matches(object, needle)),
    }));
    const objects = files.reduce((sum, file) => sum + file.objects.length, 0);
    if (!named && objects === 0) continue;
    const expanded = open.has(bundle.name) || !named;
    list.push({ kind: "bundle", bundle, open: expanded, objects });
    if (!expanded) continue;
    for (const file of files) {
      if (files.length > 1) list.push({ kind: "file", path: file.path });
      for (const object of file.objects) {
        list.push({
          kind: "object",
          address: { bundle: bundle.name, file: file.path, id: object.id },
          object,
        });
      }
    }
  }
  return list;
}

function matches(object: ObjectSummary, needle: string): boolean {
  return (
    object.class.toLowerCase().includes(needle) ||
    (object.name?.toLowerCase().includes(needle) ?? false) ||
    object.id === needle
  );
}

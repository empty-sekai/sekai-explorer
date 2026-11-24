// Finding bundles and objects by what the user types.

import type { Catalog, Located } from "./catalog";
import type { BundleSummary } from "./session";

export type Matches = { bundles: BundleSummary[]; objects: Located[] };

/**
 * The bundles whose name contains `query`, and the objects whose name, class, script, container
 * path or path ID does, each case-insensitively and at most `limit` of each. Objects whose name
 * or path ID equals the query come first.
 */
export function search(catalog: Catalog, query: string, limit: number): Matches {
  const needle = query.trim().toLowerCase();
  if (needle === "") return { bundles: [], objects: [] };
  const bundles = catalog.library.bundles
    .filter((bundle) => bundle.name.toLowerCase().includes(needle))
    .slice(0, limit);
  const exact: Located[] = [];
  const partial: Located[] = [];
  for (const located of catalog.objects) {
    const { object } = located;
    if (object.id === needle || object.name?.toLowerCase() === needle) {
      exact.push(located);
    } else if (partial.length < limit && haystack(located).includes(needle)) {
      partial.push(located);
    }
  }
  return { bundles, objects: [...exact, ...partial].slice(0, limit) };
}

function haystack({ object }: Located): string {
  return [object.name, object.class, object.script, object.id, ...(object.container ?? [])]
    .filter((part) => part)
    .join("\n")
    .toLowerCase();
}

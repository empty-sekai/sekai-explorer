// Which bundles each open bundle depends on: those its AssetBundle object declares, and those its
// objects refer to, with how many references and in which lists.

import type { Address } from "./documents";
import type { Link } from "./links";

/** A bundle that `from` depends on. */
export type Dependency = {
  from: string;
  to: string;
  /** Whether the AssetBundle object of `from` lists `to` among its dependencies. */
  declared: boolean;
  /** How many references objects of `from` make to objects of `to`. */
  count: number;
  /** The same references counted by list (a field path without its indices), most first. */
  lists: [string, number][];
};

/**
 * The dependencies of the open bundles: those `declared` gives for each bundle, and those the
 * references of `links` make.
 */
export function dependencies(
  links: Iterable<Link>,
  declared: Map<string, string[]>,
  classOf: (address: Address) => string | undefined,
): Dependency[] {
  const listed = new Set(
    [...declared].flatMap(([from, names]) => names.map((to) => pair(from, to))),
  );
  const counts = new Map<string, Map<string, number>>();
  for (const link of links) {
    if (!isDependency(link, classOf)) continue;
    const { from, to, field } = link;
    const byList = counts.get(pair(from.bundle, to.bundle)) ?? new Map<string, number>();
    const list = field.replace(/\[\d+\]/g, "[]");
    byList.set(list, (byList.get(list) ?? 0) + 1);
    counts.set(pair(from.bundle, to.bundle), byList);
  }
  return [...new Set([...listed, ...counts.keys()])].map((key) => {
    const [from = "", to = ""] = key.split("\t");
    const lists = [...(counts.get(key) ?? [])].sort(([, a], [, b]) => b - a);
    const count = lists.reduce((sum, [, n]) => sum + n, 0);
    return { from, to, declared: listed.has(key), count, lists };
  });
}

/**
 * Whether `link` makes the bundle of its object depend on another: it crosses bundles, and it is
 * not the AssetBundle object listing what it loads.
 */
export function isDependency(
  link: Link,
  classOf: (address: Address) => string | undefined,
): boolean {
  return link.from.bundle !== link.to.bundle && classOf(link.from) !== "AssetBundle";
}

function pair(from: string, to: string): string {
  return `${from}\t${to}`;
}

// The references between the objects of the open bundles, followed either way.

import { type Address, keyOf } from "./documents";

/** A reference from one object to another, in the field that holds it. */
export type Link = { from: Address; to: Address; field: string };

export class Links {
  readonly #from = new Map<string, Link[]>();
  readonly #to = new Map<string, Link[]>();

  add(link: Link) {
    push(this.#from, keyOf(link.from), link);
    push(this.#to, keyOf(link.to), link);
  }

  /** The references `address` makes. */
  from(address: Address): Link[] {
    return this.#from.get(keyOf(address)) ?? [];
  }

  /** The references made to `address`. */
  to(address: Address): Link[] {
    return this.#to.get(keyOf(address)) ?? [];
  }

  /** Every reference. */
  *all(): Generator<Link> {
    for (const links of this.#from.values()) yield* links;
  }
}

export function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

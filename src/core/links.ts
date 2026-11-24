// The references between the objects of the open bundles, followed either way: what an object
// refers to, what refers to it, the objects near one, and the references among a set.

import { type Address, keyOf } from "./documents";

/** A reference from one object to another, in the field that holds it. */
export type Link = { from: Address; to: Address; field: string };

/** Objects and the references among them. */
export type Graph = { objects: Address[]; links: Link[]; truncated: boolean };

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

  /**
   * The objects at most `depth` references from `center`, either way, and the references among
   * them. At most `limit` objects are taken, nearest first; `truncated` says whether any were
   * left out.
   */
  near(center: Address, depth: number, limit: number): Graph {
    const found = new Map([[keyOf(center), center]]);
    let ring = [center];
    let truncated = false;
    for (let step = 0; step < depth && ring.length > 0; step++) {
      const next: Address[] = [];
      for (const address of ring) {
        const neighbours = [
          ...this.from(address).map((link) => link.to),
          ...this.to(address).map((link) => link.from),
        ];
        for (const neighbour of neighbours) {
          const key = keyOf(neighbour);
          if (found.has(key)) continue;
          if (found.size >= limit) {
            truncated = true;
            continue;
          }
          found.set(key, neighbour);
          next.push(neighbour);
        }
      }
      ring = next;
    }
    const objects = [...found.values()];
    return { objects, links: this.among(objects), truncated };
  }

  /** The references among `objects`. */
  among(objects: Address[]): Link[] {
    const inside = new Set(objects.map(keyOf));
    return objects.flatMap((address) =>
      this.from(address).filter((link) => inside.has(keyOf(link.to))),
    );
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

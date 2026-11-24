// Objects the way a prefab reads: each GameObject together with its components, its children
// under it, and what it uses beside it.
//
// Three kinds of references are left out of the drawing, because they would hide the rest. The
// AssetBundle object lists every object of its bundle. Unity keeps back references beside the
// forward ones: a component names its GameObject, and a Transform names its parent. And a long
// list such as the bones of a skinned mesh is noted on its unit rather than drawn edge by edge.

import { type Address, keyOf } from "./documents";
import { type Link, push } from "./links";

/** A GameObject with its components, or any other object on its own. */
export type Unit = {
  key: string;
  /** The object it opens: the GameObject, or the object itself. */
  address: Address;
  /** The components of a GameObject, in the order it lists them. */
  components: Address[];
  /** The long lists it holds, noted rather than drawn: the field and how many objects it names. */
  lists: { field: string; count: number }[];
};

/** A child under its parent, or what a unit uses, with the fields that hold the references. */
export type Tie = { from: string; to: string; kind: "child" | "use"; fields: string[] };

/** Units and the ties among them. `truncated` says whether units were left out. */
export type Drawing = { units: Unit[]; ties: Tie[]; truncated: boolean };

/** Which way to follow ties from a unit: to what it uses, or to what uses it. */
export type Direction = "uses" | "users";

/** How many references one list of a unit may hold before they are noted rather than drawn. */
const LONGEST_DRAWN_LIST = 12;

export class Units {
  readonly #units = new Map<string, Unit>();
  /** The GameObject of each component, by key. */
  readonly #owners = new Map<string, string>();
  readonly #out = new Map<string, Tie[]>();
  readonly #in = new Map<string, Tie[]>();

  /** The units of the objects `links` connect, with `classOf` telling the class of an object. */
  constructor(links: Iterable<Link>, classOf: (address: Address) => string | undefined) {
    const drawn = [...links].filter((link) => classOf(link.from) !== "AssetBundle");
    this.#gatherComponents(drawn);
    for (const tie of this.#tie(drawn)) {
      push(this.#out, tie.from, tie);
      push(this.#in, tie.to, tie);
    }
  }

  /**
   * The units at most `depth` ties from the unit of `center`, following ties the way `direction`
   * says, and every tie among them. At most `limit` units are taken, nearest first.
   */
  around(center: Address, direction: Direction, depth: number, limit: number): Drawing {
    const ties = direction === "uses" ? this.#out : this.#in;
    const start = this.#keyOf(center);
    const found = new Set([start]);
    let ring = [start];
    let truncated = false;
    for (let step = 0; step < depth && ring.length > 0; step++) {
      const next: string[] = [];
      for (const tie of ring.flatMap((key) => ties.get(key) ?? [])) {
        const reached = direction === "uses" ? tie.to : tie.from;
        if (found.has(reached)) continue;
        if (found.size >= limit) {
          truncated = true;
          continue;
        }
        found.add(reached);
        next.push(reached);
      }
      ring = next;
    }
    return { ...this.#among(found), truncated };
  }

  /** The units that hold `objects`, and the ties among them. */
  gather(objects: Address[]): Drawing {
    const keys = new Set(objects.map((address) => this.#keyOf(address)));
    return { ...this.#among(keys), truncated: false };
  }

  /** Puts each component in the unit of its GameObject. */
  #gatherComponents(links: Link[]) {
    for (const { from, to, field } of links) {
      if (field === "m_GameObject") this.#owners.set(keyOf(from), keyOf(to));
      if (field.startsWith("m_Component[")) this.#unit(keyOf(from)).components.push(to);
    }
  }

  /**
   * The ties `links` make between units, one for each pair and kind. A long list is noted on its
   * unit instead, unless it holds children.
   */
  #tie(links: Link[]): Iterable<Tie> {
    const ties = new Map<string, Tie>();
    const forward = links.filter((link) => !isImplied(link.field));
    for (const [unit, made] of group(forward, (link) => this.#keyOf(link.from))) {
      for (const [list, held] of group(made, (link) => link.field.replace(/\[\d+\]/g, "[]"))) {
        if (held.length > LONGEST_DRAWN_LIST && !list.startsWith("m_Children[")) {
          this.#unit(unit).lists.push({ field: list, count: held.length });
          continue;
        }
        for (const { from, to, field } of held) {
          const source = this.#keyOf(from);
          const target = this.#keyOf(to);
          if (source === target) continue;
          const kind = field.startsWith("m_Children[") ? "child" : "use";
          const pair = `${source}\t${target}\t${kind}`;
          const tie = ties.get(pair) ?? { from: source, to: target, kind, fields: [] };
          tie.fields.push(field);
          ties.set(pair, tie);
        }
      }
    }
    return ties.values();
  }

  #among(keys: Set<string>): Omit<Drawing, "truncated"> {
    const units = [...keys].map((key) => this.#units.get(key) ?? lone(key));
    const ties = units.flatMap((unit) =>
      (this.#out.get(unit.key) ?? []).filter((tie) => keys.has(tie.to)),
    );
    return { units, ties };
  }

  /** The key of the unit `address` belongs to. */
  #keyOf(address: Address): string {
    const key = keyOf(address);
    return this.#owners.get(key) ?? key;
  }

  /** The unit with `key`, made the first time it is asked for. */
  #unit(key: string): Unit {
    let unit = this.#units.get(key);
    if (!unit) {
      unit = lone(key);
      this.#units.set(key, unit);
    }
    return unit;
  }
}

/**
 * Whether a reference in `field` goes without saying once units are drawn: between a GameObject
 * and its components, or from a Transform to its parent, the back of a child tie.
 */
function isImplied(field: string): boolean {
  return field === "m_GameObject" || field === "m_Father" || field.startsWith("m_Component[");
}

/** The unit of the object with `key`, with nothing in it but the object. */
function lone(key: string): Unit {
  const [bundle = "", file = "", id = ""] = key.split("\n");
  return { key, address: { bundle, file, id }, components: [], lists: [] };
}

function group<T>(items: T[], by: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) push(grouped, by(item), item);
  return grouped;
}

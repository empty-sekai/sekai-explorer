// The worker that runs the WebAssembly core, so that reading bundles never blocks the page. The
// core reads the chosen files synchronously, a range at a time, which only a worker can do.

import * as Comlink from "comlink";
import type { Address } from "./documents";
import initialize, { Explorer } from "./package/sekai_wasm.js";
import { type Member, Session } from "./session";
import type { Direction, Drawing } from "./units";

/** A bundle chosen by the user: its name and the file that holds it. */
export type Source = { name: string; file: File };

const ready = initialize();
let explorer: Explorer | undefined;
let session: Session | undefined;

const nothing: Drawing = { units: [], ties: [], truncated: false };

/** `bytes` handed over to the page, without a copy left behind. */
const handed = (bytes: Uint8Array) => Comlink.transfer(bytes, [bytes.buffer]);

const api = {
  /** Opens `sources` as the bundles of the session. */
  async open(sources: Source[]) {
    await ready;
    explorer?.free();
    explorer = new Explorer(
      sources.map((source) => source.name),
      sources.map((source) => source.file),
    );
    session = new Session(explorer);
    return session.library;
  },
  object: (address: Address) => session?.object(address),
  referrers: (address: Address) => session?.referrers(address) ?? [],
  around: (center: Address, direction: Direction, depth: number, limit: number) =>
    session?.around(center, direction, depth, limit) ?? nothing,
  gather: (objects: Address[]) => session?.gather(objects) ?? nothing,
  dependencies: () => session?.dependencies() ?? [],
  between: (from: string, to: string) => session?.between(from, to) ?? [],
  payload(sha256: string) {
    const copy = session?.payload(sha256)?.slice();
    return copy && handed(copy);
  },
  assets: (bundle: string) => session?.assets(bundle) ?? [],
  convert: (name: string) => session?.convert(name) ?? null,
  closure: (name: string) => session?.closure(name) ?? [],
  member(member: Member) {
    const bytes = session?.member(member);
    return bytes && handed(bytes);
  },
};

export type Core = typeof api;

Comlink.expose(api);

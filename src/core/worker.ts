// The worker that runs the WebAssembly core, so that reading bundles never blocks the page.

import * as Comlink from "comlink";
import type { Address } from "./documents";
import initialize, { objects } from "./package/sekai_wasm.js";
import { Session } from "./session";

/** A bundle chosen by the user: its name and the file that holds it. */
export type Source = { name: string; file: File };

const ready = initialize();
let session: Session | undefined;

const api = {
  /** Reads `sources` and makes them the bundles of the session. */
  async open(sources: Source[]) {
    await ready;
    const bundles = await Promise.all(
      sources.map(async ({ name, file }) => ({
        name,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })),
    );
    session = Session.read(objects, bundles);
    return session.library;
  },
  object: (address: Address) => session?.object(address),
  referrers: (address: Address) => session?.referrers(address) ?? [],
  payload(sha256: string) {
    const copy = session?.payload(sha256)?.slice();
    return copy && Comlink.transfer(copy, [copy.buffer]);
  },
};

export type Core = typeof api;

Comlink.expose(api);

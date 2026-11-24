// The interface's handle on the core's worker.

import * as Comlink from "comlink";
import type { Core } from "./worker";

export const core = Comlink.wrap<Core>(
  new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
);

// Where the user is: a bundle, an object of it or an asset it makes, kept in the URL so that back, forward and
// links work. The URL lives in the hash, since the site is static and the data is local.

import {
  createHashHistory,
  createRootRoute,
  createRouter,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import { Root } from "~/app/Root";

/**
 * A place: a bundle (`b`), an object of it by serialized file (`f`) and path ID (`o`), or an
 * asset it makes (`a`). With `g`, the object is shown as the centre of a graph.
 */
export type Place = { b?: string; f?: string; o?: string; a?: string; g?: string };

/**
 * A value of the place as text. The URL parser reads `12` as a number and `true` as a boolean, and
 * only when they turn back into the same text, so converting them back is exact.
 */
function text(value: unknown): string | undefined {
  const written = typeof value === "number" || typeof value === "boolean" ? String(value) : value;
  return typeof written === "string" && written !== "" ? written : undefined;
}

const root = createRootRoute({
  validateSearch: (search: Record<string, unknown>): Place => ({
    b: text(search.b),
    f: text(search.f),
    o: text(search.o),
    a: text(search.a),
    g: text(search.g),
  }),
  component: Root,
});

// Every value of a place is a string, so the URL holds it as written, without JSON quoting.
export const router = createRouter({
  routeTree: root,
  history: createHashHistory(),
  parseSearch: parseSearchWith((value) => value),
  stringifySearch: stringifySearchWith(String),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

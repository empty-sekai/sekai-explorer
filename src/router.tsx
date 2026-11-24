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
 * asset it makes (`a`).
 */
export type Place = { b?: string; f?: string; o?: string; a?: string };

const text = (value: unknown) => (typeof value === "string" && value !== "" ? value : undefined);

const root = createRootRoute({
  validateSearch: (search: Record<string, unknown>): Place => ({
    b: text(search.b),
    f: text(search.f),
    o: text(search.o),
    a: text(search.a),
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

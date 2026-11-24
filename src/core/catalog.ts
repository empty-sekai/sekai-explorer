// Lookups over a library on the interface side: objects by address, and the search index.

import { type Address, keyOf } from "./documents";
import type { BundleSummary, FileSummary, Library, ObjectSummary } from "./session";

/** An object of the library with the place it lives. */
export type Located = { address: Address; object: ObjectSummary; file: FileSummary };

export class Catalog {
  readonly library: Library;
  readonly objects: Located[] = [];
  readonly #byAddress = new Map<string, Located>();
  readonly #bundles = new Map<string, BundleSummary>();

  constructor(library: Library) {
    this.library = library;
    for (const bundle of library.bundles) {
      this.#bundles.set(bundle.name, bundle);
      for (const file of bundle.files) {
        for (const object of file.objects) {
          const located = {
            address: { bundle: bundle.name, file: file.path, id: object.id },
            object,
            file,
          };
          this.objects.push(located);
          this.#byAddress.set(keyOf(located.address), located);
        }
      }
    }
  }

  bundle(name: string): BundleSummary | undefined {
    return this.#bundles.get(name);
  }

  object(address: Address): Located | undefined {
    return this.#byAddress.get(keyOf(address));
  }
}

/** The label of an object: its name, or its class when it has none. */
export function label(object: ObjectSummary): string {
  return object.name || object.class;
}

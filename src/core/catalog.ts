// Lookups over a library on the interface side: objects by address, and the search index.

import { type Address, keyOf } from "./documents";
import type { BundleSummary, FileSummary, Library, ObjectSummary } from "./session";

/** An object as assets name it. */
export type ObjectName = { bundle: string; file?: string; path_id: string };

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

  /** The open bundle that makes the asset `name`: the longest whose name begins the asset's. */
  bundleOf(name: string): string | undefined {
    let found: string | undefined;
    for (const bundle of this.#bundles.keys()) {
      const begins = name === bundle || /^[/@]/.test(name.slice(bundle.length));
      if (name.startsWith(bundle) && begins && bundle.length > (found?.length ?? -1)) {
        found = bundle;
      }
    }
    return found;
  }

  /**
   * The object an asset names by bundle, path ID and, in a bundle of several serialized files,
   * the file.
   */
  named({ bundle, file, path_id }: ObjectName): Located | undefined {
    const files = this.bundle(bundle)?.files ?? [];
    const path = file ?? (files.length === 1 ? files[0]?.path : undefined);
    return path === undefined ? undefined : this.object({ bundle, file: path, id: path_id });
  }
}

/** The label of an object: its name, or its class when it has none. */
export function label(object: ObjectSummary): string {
  return object.name || object.class;
}

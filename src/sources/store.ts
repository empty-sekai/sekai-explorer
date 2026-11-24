// The bundles the user opened, and the library the core read from them.

import { create } from "zustand";
import { Catalog } from "~/core/catalog";
import { core } from "~/core/client";
import type { Source } from "~/core/worker";
import { queryClient } from "~/lib/query";

type Sources = {
  sources: Source[];
  catalog: Catalog | undefined;
  reading: boolean;
  error: string | undefined;
  /** Adds bundles; a bundle with the name of one already open replaces it. */
  add(sources: Source[]): Promise<void>;
};

export const useSources = create<Sources>((set, get) => ({
  sources: [],
  catalog: undefined,
  reading: false,
  error: undefined,
  async add(added) {
    if (added.length === 0) return;
    const names = new Set(added.map((source) => source.name));
    const sources = [...get().sources.filter((source) => !names.has(source.name)), ...added];
    set({ sources, reading: true, error: undefined });
    try {
      const catalog = new Catalog(await core.open(sources));
      queryClient.clear();
      set({ catalog, reading: false });
    } catch (error) {
      set({ reading: false, error: String(error) });
    }
  },
}));

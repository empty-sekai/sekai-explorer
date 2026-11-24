// Navigation, where the user is, search and what is open.

import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight, Search } from "lucide-react";
import { useEffect } from "react";
import { type Catalog, label } from "~/core/catalog";
import { m } from "~/paraglide/messages.js";
import { useSources } from "~/sources/store";
import { ClassDot, IconButton, Kbd } from "~/ui/ui";
import { OpenButtons } from "./OpenButtons";
import { Preferences } from "./Preferences";
import { addressOf, useGo, usePlace } from "./place";

export function TopBar({ catalog, onSearch }: { catalog: Catalog; onSearch: () => void }) {
  const router = useRouter();
  const reading = useSources((state) => state.reading);
  const { library } = catalog;

  useEffect(() => {
    const open = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSearch();
      }
    };
    window.addEventListener("keydown", open);
    return () => window.removeEventListener("keydown", open);
  }, [onSearch]);

  return (
    <header className="relative flex h-11 shrink-0 items-center gap-1 border-b border-line bg-surface px-2">
      <img src="/icon.svg" alt="" className="mx-1 size-5" />
      <IconButton label={m.back()} disabled={!useCanGoBack()} onClick={() => router.history.back()}>
        <ArrowLeft className="size-4" />
      </IconButton>
      <IconButton label={m.forward()} onClick={() => router.history.forward()}>
        <ArrowRight className="size-4" />
      </IconButton>
      <Breadcrumb catalog={catalog} />
      <button
        type="button"
        onClick={onSearch}
        className="flex h-7 w-44 shrink-0 items-center gap-2 lg:w-72 rounded-md border border-line bg-canvas px-2 text-ink-faint hover:border-line-strong"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">{m.search()}</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <span className="ms-3 hidden whitespace-nowrap text-2xs text-ink-faint lg:inline">
        {m.bundle_count({ count: library.bundles.length })} ·{" "}
        {m.object_count({ count: catalog.objects.length })}
        {library.failures.length > 0 && (
          <span className="text-danger">
            {" "}
            · {m.failure_count({ count: library.failures.length })}
          </span>
        )}
      </span>
      <OpenButtons quiet />
      <Preferences />
      {reading && <div className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-accent" />}
    </header>
  );
}

function Breadcrumb({ catalog }: { catalog: Catalog }) {
  const place = usePlace();
  const go = useGo();
  const address = addressOf(place);
  const located = address && catalog.object(address);
  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 px-2 text-ink-soft">
      {place.b && (
        <button
          type="button"
          onClick={() => go({ b: place.b })}
          className="truncate font-mono text-2xs hover:text-ink"
        >
          {place.b}
        </button>
      )}
      {located && (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-ink-faint" />
          <span className="flex min-w-0 items-center gap-1.5 text-ink">
            <ClassDot name={located.object.class} />
            <span className="truncate">{label(located.object)}</span>
          </span>
        </>
      )}
    </nav>
  );
}

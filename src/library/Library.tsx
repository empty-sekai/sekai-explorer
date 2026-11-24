// The left pane: every open bundle and, below an open one, its objects.

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, FileBox, Package, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { addressOf, placeOf, useGo, usePlace } from "~/app/place";
import { type Catalog, label } from "~/core/catalog";
import { keyOf } from "~/core/documents";
import { explain } from "~/lib/errors";
import { count } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import type { Place } from "~/router";
import { ClassDot, cn, Pane } from "~/ui/ui";
import { type Row, rows } from "./rows";

const ROW_HEIGHT = 26;

export function Library({ catalog }: { catalog: Catalog }) {
  const place = usePlace();
  const go = useGo();
  const [filter, setFilter] = useState("");
  const [opened, setOpened] = useState(() => new Set<string>());
  // The bundle of the current place is always open, so the selection is visible.
  const open = place.b ? opened.union(new Set([place.b])) : opened;
  const list = rows(catalog.library.bundles, open, filter);
  const selected = addressOf(place);
  const selectedKey = selected && keyOf(selected);

  const toggle = (name: string) => {
    const next = new Set(opened);
    if (open.has(name)) next.delete(name);
    else next.add(name);
    setOpened(next);
  };

  const scroller = useRef<HTMLDivElement>(null);
  const virtual = useVirtualizer({
    count: list.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  return (
    <Pane title={m.library()}>
      <div className="flex h-full flex-col">
        <div className="border-b border-line p-2">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={m.library_filter()}
            className="h-7 w-full rounded-md border border-line bg-canvas px-2 outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>
        <div ref={scroller} className="min-h-0 flex-1 overflow-auto py-1">
          <div className="relative" style={{ height: virtual.getTotalSize() }}>
            {virtual.getVirtualItems().map((item) => {
              const row = list[item.index];
              if (!row) return null;
              return (
                <div
                  key={item.key}
                  className="absolute inset-x-0"
                  style={{ height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
                >
                  <LibraryRow
                    row={row}
                    selected={
                      row.kind === "object"
                        ? keyOf(row.address) === selectedKey
                        : row.kind === "bundle" && !selected && row.bundle.name === place.b
                    }
                    onToggle={toggle}
                    onSelect={go}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {catalog.library.failures.length > 0 && <Failures catalog={catalog} />}
      </div>
    </Pane>
  );
}

type RowProps = {
  row: Row;
  selected: boolean;
  onToggle: (bundle: string) => void;
  onSelect: (place: Place) => void;
};

function LibraryRow({ row, selected, onToggle, onSelect }: RowProps) {
  const base = cn(
    "flex h-full w-full items-center gap-1.5 pe-2 text-left hover:bg-hover",
    selected && "bg-selected hover:bg-selected",
  );
  switch (row.kind) {
    case "bundle": {
      const { name } = row.bundle;
      const slash = name.lastIndexOf("/");
      return (
        <button type="button" className={cn(base, "ps-1")} onClick={() => onSelect({ b: name })}>
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-ink-faint transition-transform",
              row.open && "rotate-90",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(name);
            }}
          />
          <Package className="size-3.5 shrink-0 text-ink-faint" />
          <span className="min-w-0 flex-1 truncate font-mono text-2xs" title={name}>
            <span className="text-ink-faint">{name.slice(0, slash + 1)}</span>
            {name.slice(slash + 1)}
          </span>
          <span className="text-2xs text-ink-faint">{count(row.objects)}</span>
        </button>
      );
    }
    case "file":
      return (
        <div className="flex h-full items-center gap-1.5 ps-7 text-2xs text-ink-faint">
          <FileBox className="size-3.5" />
          <span className="truncate font-mono">{row.path}</span>
        </div>
      );
    case "object":
      return (
        <button
          type="button"
          className={cn(base, "ps-8")}
          onClick={() => onSelect(placeOf(row.address))}
        >
          <ClassDot name={row.object.class} />
          <span className="min-w-0 truncate">{label(row.object)}</span>
          {row.object.name && (
            <span className="truncate text-2xs text-ink-faint">{row.object.class}</span>
          )}
          {row.object.error && <TriangleAlert className="size-3.5 shrink-0 text-danger" />}
        </button>
      );
  }
}

function Failures({ catalog }: { catalog: Catalog }) {
  return (
    <details className="max-h-40 shrink-0 overflow-auto border-t border-line px-3 py-2 text-2xs">
      <summary className="cursor-pointer text-danger">
        {m.unreadable_bundles()} · {count(catalog.library.failures.length)}
      </summary>
      <ul className="mt-1 space-y-1">
        {catalog.library.failures.map((failure) => (
          <li key={failure.bundle} className="font-mono">
            <div className="truncate">{failure.bundle}</div>
            <div className="text-ink-faint">{explain(failure.reason)}</div>
          </li>
        ))}
      </ul>
    </details>
  );
}

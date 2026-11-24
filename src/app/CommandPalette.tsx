// Ctrl+K: jump to any bundle or object.

import { Command } from "cmdk";
import { Package } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { type Catalog, label } from "~/core/catalog";
import { keyOf } from "~/core/documents";
import { search } from "~/core/search";
import { m } from "~/paraglide/messages.js";
import type { Place } from "~/router";
import { ClassDot } from "~/ui/ui";
import { placeOf, useGo } from "./place";

const LIMIT = 50;

type Props = { catalog: Catalog; open: boolean; onOpenChange: (open: boolean) => void };

export function CommandPalette({ catalog, open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const matches = search(catalog, useDeferredValue(query), LIMIT);
  const go = useGo();
  const jump = (place: Place) => {
    go(place);
    onOpenChange(false);
  };
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label={m.search()}
      overlayClassName="fixed inset-0 z-40 bg-black/20"
      contentClassName="fixed left-1/2 top-[12vh] z-50 w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-raised shadow-2xl"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder={m.search_placeholder()}
        className="h-11 w-full border-b border-line bg-transparent px-4 outline-none placeholder:text-ink-faint"
      />
      <Command.List className="max-h-[60vh] overflow-auto p-1">
        {query.trim() !== "" && (
          <Command.Empty className="p-4 text-ink-faint">{m.search_empty()}</Command.Empty>
        )}
        {matches.bundles.length > 0 && (
          <Command.Group heading={m.search_bundles()} className={GROUP}>
            {matches.bundles.map((bundle) => (
              <Command.Item
                key={bundle.name}
                value={`b:${bundle.name}`}
                onSelect={() => jump({ b: bundle.name })}
                className={ITEM}
              >
                <Package className="size-3.5 text-ink-faint" />
                <span className="truncate font-mono text-2xs">{bundle.name}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {matches.objects.length > 0 && (
          <Command.Group heading={m.search_objects()} className={GROUP}>
            {matches.objects.map(({ address, object }) => (
              <Command.Item
                key={keyOf(address)}
                value={`o:${keyOf(address)}`}
                onSelect={() => jump(placeOf(address))}
                className={ITEM}
              >
                <ClassDot name={object.class} />
                <span className="truncate">{label(object)}</span>
                <span className="text-2xs text-ink-faint">{object.class}</span>
                <span className="ms-auto truncate font-mono text-2xs text-ink-faint">
                  {address.bundle}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

const GROUP =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-ink-faint";
const ITEM =
  "flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 data-[selected=true]:bg-selected";

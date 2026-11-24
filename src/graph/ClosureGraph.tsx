// The objects converting an asset could read, as units with the ties among them: units the
// conversion read from stand out from those it did not.

import { LoaderCircle } from "lucide-react";
import { placeOf, useGo } from "~/app/place";
import type { Catalog } from "~/core/catalog";
import { keyOf } from "~/core/documents";
import { useGathered } from "~/core/queries";
import type { SourceObject } from "~/core/session";
import type { Unit } from "~/core/units";
import { m } from "~/paraglide/messages.js";
import { ObjectGraph } from "./ObjectGraph";

/** The most objects a closure graph draws. */
const LIMIT = 600;

export default function ClosureGraph({
  catalog,
  read,
  unread,
  home,
}: {
  catalog: Catalog;
  read: SourceObject[];
  unread: SourceObject[];
  home: string;
}) {
  const go = useGo();
  const located = (objects: SourceObject[]) =>
    objects.flatMap((object) => catalog.named(object)?.address ?? []);
  const wasRead = new Set(located(read).map(keyOf));
  const objects = [...located(read), ...located(unread)];
  const drawable = objects.length <= LIMIT;
  const { data: drawing } = useGathered(objects, drawable);
  if (!drawable) return <p className="text-ink-faint">{m.graph_too_large()}</p>;
  const readFrom = (unit: Unit) =>
    [unit.address, ...unit.components].some((address) => wasRead.has(keyOf(address)));
  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-lg border border-line">
      <div className="flex h-7 shrink-0 items-center gap-3 border-b border-line px-3 text-2xs text-ink-soft">
        <Key className="border-accent bg-selected">{m.graph_read()}</Key>
        <Key className="border-dashed border-line-strong">{m.graph_unread()}</Key>
      </div>
      {drawing ? (
        <ObjectGraph
          catalog={catalog}
          drawing={drawing}
          home={home}
          toneOf={(unit) => (readFrom(unit) ? "read" : "unread")}
          onOpen={(address) => go(placeOf(address))}
        />
      ) : (
        <LoaderCircle className="m-8 size-4 animate-spin text-ink-soft" />
      )}
    </div>
  );
}

function Key({ className, children }: { className: string; children: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`size-2.5 rounded-[3px] border ${className}`} />
      {children}
    </span>
  );
}

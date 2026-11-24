// A reference as a link to the object it points to.

import { ArrowUpRight, Box } from "lucide-react";
import { placeOf, useGo } from "~/app/place";
import { type Catalog, label } from "~/core/catalog";
import { type Address, type Reference, resolve } from "~/core/documents";
import { m } from "~/paraglide/messages.js";
import { ClassDot } from "~/ui/ui";

type Props = { catalog: Catalog; from: Address; reference: Reference };

export function ReferenceChip({ catalog, from, reference }: Props) {
  const go = useGo();
  const target = resolve(reference, from);

  if (!("address" in target)) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded bg-hover px-1.5 text-ink-soft">
        <Box className="size-3 shrink-0" />
        <span className="truncate">{target.external}</span>
        <span className="text-ink-faint">#{target.id}</span>
      </span>
    );
  }

  const { address } = target;
  const located = catalog.object(address);
  if (!located) {
    const elsewhere = address.bundle !== from.bundle;
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded bg-danger-soft px-1.5 text-danger">
        <span className="truncate">{elsewhere ? address.bundle : address.file}</span>
        <span>#{address.id}</span>
        <span className="text-ink-faint">· {m.external_not_open()}</span>
      </span>
    );
  }

  const { object } = located;
  return (
    <button
      type="button"
      onClick={() => go(placeOf(address))}
      className="inline-flex max-w-full items-center gap-1 rounded bg-accent-soft px-1.5 text-accent hover:underline"
      title={`${address.bundle} · ${address.file} · ${address.id}`}
    >
      <ClassDot name={object.class} />
      <span className="truncate">{label(object)}</span>
      {object.name && <span className="text-ink-faint">{object.class}</span>}
      {address.bundle !== from.bundle && (
        <span className="truncate text-ink-faint">· {address.bundle}</span>
      )}
      <ArrowUpRight className="size-3 shrink-0" />
    </button>
  );
}

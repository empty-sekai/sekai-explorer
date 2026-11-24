// The fields of an object as a tree: structures and arrays fold, references are links, and
// byte payloads open as hex.

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Catalog } from "~/core/catalog";
import { type Address, isBytes, isReference, type Value } from "~/core/documents";
import { m } from "~/paraglide/messages.js";
import { cn } from "~/ui/ui";
import { BytesView } from "./BytesView";
import { ReferenceChip } from "./ReferenceChip";

/** How many items of an array are shown before "show more". */
const PAGE = 100;
/** Structures shallower than this start open. */
const OPEN_DEPTH = 2;

type Context = { catalog: Catalog; from: Address; filter: string };

export function FieldTree({ value, ...context }: Context & { value: Value }) {
  const filter = context.filter.trim().toLowerCase();
  return (
    <div className="font-mono text-2xs leading-5">
      {children(value, "").map((child) => (
        <Field key={child.name} child={child} depth={0} context={{ ...context, filter }} />
      ))}
    </div>
  );
}

type FieldProps = { child: Child; depth: number; context: Context };

function Field({ child: { name, path, value }, depth, context }: FieldProps) {
  const [open, setOpen] = useState(depth < OPEN_DEPTH);
  const [shown, setShown] = useState(PAGE);
  const { filter } = context;
  if (filter !== "" && !contains({ name, path, value }, filter)) return null;

  const items = children(value, path);
  const foldable = items.length > 0;
  const expanded = foldable && (open || filter !== "");
  const indent = { paddingInlineStart: `${depth * 14}px` };

  return (
    <>
      <div className="group flex min-w-0 items-start gap-1 rounded hover:bg-hover" style={indent}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn("mt-0.5 shrink-0 text-ink-faint", !foldable && "invisible")}
          tabIndex={foldable ? 0 : -1}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <span className="shrink-0 text-ink-soft" title={path}>
          {name}
        </span>
        <span className="min-w-0 flex-1 ps-2">
          <Leaf value={value} context={context} count={items.length} />
        </span>
      </div>
      {expanded && (
        <>
          {items.slice(0, shown).map((item) => (
            <Field key={item.name} child={item} depth={depth + 1} context={context} />
          ))}
          {items.length > shown && (
            <button
              type="button"
              onClick={() => setShown(shown + PAGE)}
              className="text-accent hover:underline"
              style={{ paddingInlineStart: `${(depth + 1) * 14 + 18}px` }}
            >
              {m.show_more({ count: Math.min(PAGE, items.length - shown) })}
            </button>
          )}
        </>
      )}
    </>
  );
}

function Leaf({ value, context, count }: { value: Value; context: Context; count: number }) {
  if (value === null) return <span className="text-ink-faint">null</span>;
  if (typeof value === "boolean")
    return <span className="text-[var(--class-script)]">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-[var(--class-texture)]">{value}</span>;
  if (typeof value === "string")
    return <span className="break-all text-[var(--class-mesh)]">{JSON.stringify(value)}</span>;
  if (isReference(value))
    return <ReferenceChip catalog={context.catalog} from={context.from} reference={value} />;
  if (isBytes(value)) return <BytesView bytes={value} />;
  return (
    <span className="text-ink-faint">
      {Array.isArray(value) ? `[${m.item_count({ count })}]` : `{${count}}`}
    </span>
  );
}

/** A field: its name, its path from the object (`m_Materials[0].m_FileID`) and its value. */
type Child = { name: string; path: string; value: Value };

/** The fields of a structure or the items of an array at `path`; none for any other value. */
function children(value: Value, path: string): Child[] {
  if (typeof value !== "object" || value === null || isBytes(value) || isReference(value))
    return [];
  if (Array.isArray(value)) {
    return value.map((item, i) => ({ name: `[${i}]`, path: `${path}[${i}]`, value: item }));
  }
  return Object.entries(value).map(([name, field]) => ({
    name,
    path: path === "" ? name : `${path}.${name}`,
    value: field,
  }));
}

/** Whether `filter` appears in the path of this field or of a field below it. */
function contains(field: Child, filter: string): boolean {
  return (
    field.path.toLowerCase().includes(filter) ||
    children(field.value, field.path).some((child) => contains(child, filter))
  );
}

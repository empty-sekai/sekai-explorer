// The units around one object: what it uses, or what uses it, as many ties away as asked. Opening
// a unit of the graph puts it in the centre.

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { placeOf, useGo } from "~/app/place";
import type { Catalog } from "~/core/catalog";
import { type Address, keyOf } from "~/core/documents";
import { useAround } from "~/core/queries";
import type { Direction } from "~/core/units";
import { m } from "~/paraglide/messages.js";
import { cn } from "~/ui/ui";
import { ObjectGraph } from "./ObjectGraph";

/** The most units a graph draws, nearest first. */
const LIMIT = 300;
/** The depths offered; the last follows ties as far as they go. */
const DEPTHS = [1, 2, 3, 64];

export default function NearGraph({ catalog, center }: { catalog: Catalog; center: Address }) {
  const go = useGo();
  const [direction, setDirection] = useState<Direction>("uses");
  const [depth, setDepth] = useState(2);
  const { data: drawing } = useAround(center, direction, depth, LIMIT);
  const centerKey = keyOf(center);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line px-3">
        <Choice active={direction === "uses"} onClick={() => setDirection("uses")}>
          {m.graph_uses()}
        </Choice>
        <Choice active={direction === "users"} onClick={() => setDirection("users")}>
          {m.graph_users()}
        </Choice>
        <span className="ms-3 me-1 text-ink-soft">{m.graph_depth()}</span>
        {DEPTHS.map((each, i) => (
          <Choice key={each} active={each === depth} onClick={() => setDepth(each)}>
            {i === DEPTHS.length - 1 ? m.graph_all() : String(each)}
          </Choice>
        ))}
        {drawing?.truncated && (
          <span className="ms-2 text-2xs text-ink-faint">{m.graph_truncated()}</span>
        )}
      </div>
      {!drawing ? (
        <LoaderCircle className="m-8 size-4 animate-spin text-ink-soft" />
      ) : drawing.units.length < 2 ? (
        <p className="p-8 text-center text-ink-faint">{m.graph_alone()}</p>
      ) : (
        <ObjectGraph
          catalog={catalog}
          drawing={drawing}
          home={center.bundle}
          toneOf={(unit) =>
            unit.key === centerKey || unit.components.some((each) => keyOf(each) === centerKey)
              ? "center"
              : "plain"
          }
          onOpen={(address) => go({ ...placeOf(address), g: "objects" })}
        />
      )}
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-6 min-w-6 rounded-md px-2 text-ink-soft",
        active ? "bg-selected text-ink" : "hover:bg-hover",
      )}
    >
      {children}
    </button>
  );
}

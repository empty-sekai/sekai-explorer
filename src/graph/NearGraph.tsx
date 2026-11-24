// The objects around one object, as many references away either way as asked, drawn as a graph.
// Opening an object of the graph puts it in the centre.

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { placeOf, useGo } from "~/app/place";
import type { Catalog } from "~/core/catalog";
import { type Address, keyOf } from "~/core/documents";
import { useNear } from "~/core/queries";
import { m } from "~/paraglide/messages.js";
import { cn } from "~/ui/ui";
import { ObjectGraph } from "./ObjectGraph";

/** The most objects a graph draws, nearest first. */
const LIMIT = 300;
const DEPTHS = [1, 2, 3, 4];

export default function NearGraph({ catalog, center }: { catalog: Catalog; center: Address }) {
  const go = useGo();
  const [depth, setDepth] = useState(2);
  const { data: graph } = useNear(center, depth, LIMIT);
  const centerKey = keyOf(center);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="text-ink-soft">{m.graph_depth()}</span>
        {DEPTHS.map((each) => (
          <button
            key={each}
            type="button"
            onClick={() => setDepth(each)}
            aria-pressed={each === depth}
            className={cn(
              "h-6 w-6 rounded-md text-ink-soft",
              each === depth ? "bg-selected text-ink" : "hover:bg-hover",
            )}
          >
            {each}
          </button>
        ))}
        {graph?.truncated && <span className="text-2xs text-ink-faint">{m.graph_truncated()}</span>}
      </div>
      {!graph ? (
        <LoaderCircle className="m-8 size-4 animate-spin text-ink-soft" />
      ) : graph.objects.length < 2 ? (
        <p className="p-8 text-center text-ink-faint">{m.graph_alone()}</p>
      ) : (
        <div className="min-h-0 flex-1">
          <ObjectGraph
            catalog={catalog}
            objects={graph.objects}
            links={graph.links}
            home={center.bundle}
            toneOf={(address) => (keyOf(address) === centerKey ? "center" : "plain")}
            onOpen={(address) => go({ ...placeOf(address), g: "1" })}
          />
        </div>
      )}
    </div>
  );
}

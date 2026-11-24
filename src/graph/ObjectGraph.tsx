// Units and the ties among them, drawn left to right: a GameObject with its components on one card,
// its children after it, and what it uses beside them. Each class can be hidden, and a unit opens
// on click.

import { type Edge, MarkerType, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { type Catalog, label } from "~/core/catalog";
import type { Address } from "~/core/documents";
import type { Drawing, Tie, Unit } from "~/core/units";
import { count } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, cn } from "~/ui/ui";
import { Card, Flow, Legend } from "./parts";

/** How a unit stands in the graph. The centre is never hidden with its class. */
export type Tone = "center" | "read" | "unread" | "plain";

type UnitData = {
  unit: Unit;
  name: string;
  className: string;
  /** The classes of its components but its Transform, which every GameObject has. */
  components: string[];
  /** The bundle, when the unit lives in another one than the graph is about. */
  bundle?: string;
  /** Whether its bundle is open. */
  open: boolean;
  tone: Tone;
};
type UnitNode = Node<UnitData, "unit">;

const HEIGHT = 58;
/** Edges are labelled only while there are few enough to read. */
const LABELLED_EDGES = 60;

export function ObjectGraph({
  catalog,
  drawing,
  home,
  toneOf,
  onOpen,
}: {
  catalog: Catalog;
  drawing: Drawing;
  /** The bundle the graph is about; units of other bundles show theirs. */
  home: string;
  toneOf: (unit: Unit) => Tone;
  onOpen: (address: Address) => void;
}) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const all = drawing.units.map((unit) => unitNode(catalog, unit, home, toneOf(unit)));
  const nodes = all.filter(({ data }) => data.tone === "center" || !hidden.has(data.className));
  const shown = new Set(nodes.map((node) => node.id));
  const ties = drawing.ties.filter((tie) => shown.has(tie.from) && shown.has(tie.to));
  const labelled = ties.length <= LABELLED_EDGES;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Legend
        classes={tally(all.map(({ data }) => data.className))}
        hidden={hidden}
        onToggle={(name) => setHidden(toggled(hidden, name))}
      >
        <EdgeKey />
      </Legend>
      <Flow
        nodes={nodes}
        edges={ties.map((tie) => tieEdge(tie, labelled))}
        nodeTypes={NODE_TYPES}
        onNodeClick={(node: UnitNode) => node.data.open && onOpen(node.data.unit.address)}
      />
    </div>
  );
}

const NODE_TYPES = { unit: UnitCard };

function UnitCard({ data }: NodeProps<UnitNode>) {
  const { unit, tone } = data;
  return (
    <Card
      className={cn(
        tone === "center" && "border-accent ring-2 ring-accent/30",
        tone === "read" && "border-accent bg-selected",
        tone === "unread" && "border-dashed opacity-70",
        !data.open && "cursor-default border-danger/60 border-dashed",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <ClassDot name={data.className} />
        <span className="truncate text-ink">{data.name}</span>
      </span>
      <span className="truncate text-2xs text-ink-faint">
        {data.open ? data.components.join(" · ") || data.className : m.graph_not_open()}
        {data.bundle && ` · ${data.bundle}`}
      </span>
      {unit.lists.length > 0 && (
        <span className="truncate font-mono text-2xs text-ink-faint">
          {unit.lists.map((list) => `${list.field} ×${count(list.count)}`).join(" · ")}
        </span>
      )}
    </Card>
  );
}

/** A child tie as a plain line, a use as a dashed arrow labelled with its field. */
function tieEdge(tie: Tie, labelled: boolean): Edge {
  const use = tie.kind === "use";
  return {
    id: `${tie.from}\t${tie.to}\t${tie.kind}`,
    source: tie.from,
    target: tie.to,
    label: use && labelled ? fieldLabel(tie.fields) : undefined,
    labelStyle: { fontSize: 10 },
    style: use ? { strokeDasharray: "4 3" } : undefined,
    markerEnd: use ? { type: MarkerType.ArrowClosed } : undefined,
  };
}

function EdgeKey() {
  return (
    <span className="flex items-center gap-1.5 text-2xs text-ink-faint">
      <Line />
      {m.graph_child()}
      <Line dashed />
      {m.graph_use()}
    </span>
  );
}

function Line({ dashed = false }: { dashed?: boolean }) {
  return (
    <svg width="20" height="6" aria-hidden>
      <line
        x1="0"
        y1="3"
        x2="20"
        y2="3"
        stroke="currentColor"
        strokeDasharray={dashed ? "4 3" : undefined}
      />
    </svg>
  );
}

function unitNode(catalog: Catalog, unit: Unit, home: string, tone: Tone): UnitNode {
  const located = catalog.object(unit.address);
  const name = located ? label(located.object) : `#${unit.address.id}`;
  const components = unit.components
    .map((address) => catalog.object(address)?.object.class ?? "")
    .filter((name) => name !== "" && name !== "Transform");
  return {
    id: unit.key,
    type: "unit",
    position: { x: 0, y: 0 },
    width: Math.min(280, Math.max(150, name.length * 7 + 48)),
    height: HEIGHT,
    data: {
      unit,
      name,
      className: located?.object.class ?? "",
      components,
      bundle: unit.address.bundle === home ? undefined : unit.address.bundle,
      open: located !== undefined,
      tone,
    },
  };
}

function fieldLabel([first = "", ...rest]: string[]): string {
  return rest.length > 0 ? `${first} +${rest.length}` : first;
}

function tally(classes: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const name of classes) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].sort(([, a], [, b]) => b - a);
}

function toggled(set: ReadonlySet<string>, name: string): ReadonlySet<string> {
  const next = new Set(set);
  if (!next.delete(name)) next.add(name);
  return next;
}

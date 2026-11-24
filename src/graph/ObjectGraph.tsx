// Objects and the references among them, drawn as a layered graph. Each class can be hidden, an
// object opens on click, and edges are labelled with the field that holds the reference.

import "@xyflow/react/dist/style.css";
import {
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useState } from "react";
import { type Catalog, label } from "~/core/catalog";
import { type Address, keyOf } from "~/core/documents";
import type { Link } from "~/core/links";
import { count } from "~/lib/format";
import { useDark } from "~/lib/theme";
import { m } from "~/paraglide/messages.js";
import { ClassDot, cn } from "~/ui/ui";
import { layout } from "./layout";

/** How an object stands in the graph. The centre is never hidden with its class. */
export type Tone = "center" | "read" | "unread" | "plain";

type ObjectData = {
  address: Address;
  name: string;
  className: string;
  bundle?: string;
  tone: Tone;
};
type ObjectNode = Node<ObjectData, "object">;

const HEIGHT = 44;
/** Edges are labelled only while there are few enough to read. */
const LABELLED_EDGES = 60;

export type ObjectGraphProps = {
  catalog: Catalog;
  objects: Address[];
  links: Link[];
  /** The bundle the graph is about; objects of other bundles show theirs. */
  home: string;
  toneOf: (address: Address) => Tone;
  onOpen: (address: Address) => void;
};

export function ObjectGraph({ catalog, objects, links, home, toneOf, onOpen }: ObjectGraphProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const nodes = objects
    .map((address) => objectNode(catalog, address, home, toneOf(address)))
    .filter(({ data }) => data.tone === "center" || !hidden.has(data.className));
  const edges = merge(nodes, links);
  place(nodes, edges);
  const toggle = (name: string) => {
    const next = new Set(hidden);
    if (!next.delete(name)) next.add(name);
    setHidden(next);
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Legend
        classes={tally(objects.map((address) => classOf(catalog, address)))}
        hidden={hidden}
        onToggle={toggle}
      />
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          forceColorMode={useDark() ? "dark" : "light"}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, node) => onOpen(node.data.address)}
          minZoom={0.1}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
          style={{ backgroundColor: "transparent" }}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

const NODE_TYPES = { object: ObjectBox };

function ObjectBox({ data }: NodeProps<ObjectNode>) {
  return (
    <div
      className={cn(
        "flex h-11 w-full cursor-pointer flex-col justify-center rounded-md border bg-surface px-2 text-[12px] shadow-sm",
        data.tone === "center" && "border-accent ring-2 ring-accent/30",
        data.tone === "read" && "border-accent bg-selected",
        data.tone === "unread" && "border-dashed border-line-strong opacity-70",
        data.tone === "plain" && "border-line-strong",
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <span className="flex min-w-0 items-center gap-1.5">
        <ClassDot name={data.className} />
        <span className="truncate text-ink">{data.name}</span>
      </span>
      <span className="truncate text-2xs text-ink-faint">
        {data.className}
        {data.bundle && ` · ${data.bundle}`}
      </span>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

function Legend({
  classes,
  hidden,
  onToggle,
}: {
  classes: [string, number][];
  hidden: ReadonlySet<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-3 py-1.5">
      {classes.map(([name, n]) => (
        <button
          key={name}
          type="button"
          onClick={() => onToggle(name)}
          aria-pressed={!hidden.has(name)}
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs hover:bg-hover",
            hidden.has(name) && "line-through opacity-40",
          )}
        >
          <ClassDot name={name} />
          {name}
          <span className="text-ink-faint">{count(n)}</span>
        </button>
      ))}
      <span className="ms-auto text-2xs text-ink-faint">{m.graph_hide()}</span>
    </div>
  );
}

function objectNode(catalog: Catalog, address: Address, home: string, tone: Tone): ObjectNode {
  const located = catalog.object(address);
  const name = located ? label(located.object) : address.id;
  return {
    id: keyOf(address),
    type: "object",
    position: { x: 0, y: 0 },
    width: Math.min(260, Math.max(140, name.length * 7 + 40)),
    height: HEIGHT,
    data: {
      address,
      name,
      className: classOf(catalog, address),
      bundle: address.bundle === home ? undefined : address.bundle,
      tone,
    },
  };
}

/** One edge for each pair of shown objects with references between them, labelled by field. */
function merge(nodes: ObjectNode[], links: Link[]): Edge[] {
  const shown = new Set(nodes.map((node) => node.id));
  const fields = new Map<string, { source: string; target: string; names: string[] }>();
  for (const link of links) {
    const source = keyOf(link.from);
    const target = keyOf(link.to);
    if (source === target || !shown.has(source) || !shown.has(target)) continue;
    const id = `${source}\t${target}`;
    const edge = fields.get(id) ?? { source, target, names: [] };
    edge.names.push(link.field);
    fields.set(id, edge);
  }
  const labelled = fields.size <= LABELLED_EDGES;
  return [...fields].map(([id, { source, target, names }]) => ({
    id,
    source,
    target,
    label: labelled ? fieldLabel(names) : undefined,
    labelStyle: { fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
}

/** Moves each of `nodes` to its place in the layout of the graph. */
function place(nodes: ObjectNode[], edges: Edge[]) {
  const placed = layout(
    nodes.map(({ id, width = 0, height = 0 }) => ({ id, width, height })),
    edges.map(({ source, target }) => [source, target]),
  );
  for (const node of nodes) node.position = placed.get(node.id) ?? node.position;
}

function classOf(catalog: Catalog, address: Address): string {
  return catalog.object(address)?.object.class ?? "";
}

function fieldLabel([first = "", ...rest]: string[]): string {
  return rest.length > 0 ? `${first} +${rest.length}` : first;
}

function tally(classes: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const name of classes) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].sort(([, a], [, b]) => b - a);
}

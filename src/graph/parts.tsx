// What every graph is drawn with: a flow laid out left to right, its cards, and a legend whose
// classes can be hidden.

import "@xyflow/react/dist/style.css";
import {
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeTypes,
  Position,
  ReactFlow,
} from "@xyflow/react";
import type { ReactNode } from "react";
import { count } from "~/lib/format";
import { useDark } from "~/lib/theme";
import { m } from "~/paraglide/messages.js";
import { ClassDot, cn } from "~/ui/ui";
import { layout } from "./layout";

/** `nodes` and `edges`, placed so that each edge runs left to right where it can. */
export function Flow<N extends Node>({
  nodes,
  edges,
  nodeTypes,
  onNodeClick,
  onEdgeClick,
}: {
  nodes: N[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodeClick?: (node: N) => void;
  onEdgeClick?: (edge: Edge) => void;
}) {
  const placed = layout(
    nodes.map(({ id, width = 0, height = 0 }) => ({ id, width, height })),
    edges.map(({ source, target }) => [source, target]),
  );
  const positioned = nodes.map((node) => ({
    ...node,
    position: placed.get(node.id) ?? node.position,
  }));
  return (
    <div className="min-h-0 flex-1">
      <ReactFlow
        nodes={positioned}
        edges={edges}
        nodeTypes={nodeTypes}
        forceColorMode={useDark() ? "dark" : "light"}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        onEdgeClick={(_, edge) => onEdgeClick?.(edge)}
        minZoom={0.05}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        style={{ backgroundColor: "transparent" }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

/** A card of a graph, entered from the left and left from the right. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full w-full cursor-pointer flex-col justify-center rounded-md border border-line-strong bg-surface px-2 text-[12px] shadow-sm",
        className,
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      {children}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

/** The classes of a graph with how many of each, each a button that hides or shows it. */
export function Legend({
  classes,
  hidden,
  onToggle,
  children,
}: {
  classes: [string, number][];
  hidden: ReadonlySet<string>;
  onToggle: (name: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-3 py-1.5">
      {classes.map(([name, n]) => (
        <button
          key={name}
          type="button"
          onClick={() => onToggle(name)}
          aria-pressed={!hidden.has(name)}
          title={m.graph_hide()}
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs hover:bg-hover",
            hidden.has(name) && "line-through opacity-40",
          )}
        >
          <ClassDot name={name} />
          {name || m.graph_not_open()}
          <span className="text-ink-faint">{count(n)}</span>
        </button>
      ))}
      <span className="ms-auto">{children}</span>
    </div>
  );
}

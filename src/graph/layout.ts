// Where the objects of a graph go: layers from left to right, so that an object stands to the
// right of the objects that refer to it.

import dagre from "@dagrejs/dagre";

export type Box = { id: string; width: number; height: number };
export type Point = { x: number; y: number };

/** The top-left corner of each of `boxes`, keyed by id, with `arrows` given as [from, to]. */
export function layout(boxes: Box[], arrows: [string, string][]): Map<string, Point> {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "LR", nodesep: 14, ranksep: 90 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const { id, width, height } of boxes) graph.setNode(id, { width, height });
  for (const [from, to] of arrows) if (from !== to) graph.setEdge(from, to);
  dagre.layout(graph);
  const placed = new Map<string, Point>();
  for (const { id, width, height } of boxes) {
    const { x, y } = graph.node(id);
    placed.set(id, { x: x - width / 2, y: y - height / 2 });
  }
  return placed;
}

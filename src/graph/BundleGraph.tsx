// How the open bundles depend on each other: an arrow from a bundle to each bundle its objects
// refer to or its AssetBundle object declares, with how many references it makes. Bundles that
// are not open show which ones are still needed. Clicking an arrow lists its references.

import { type Edge, MarkerType, type Node, type NodeProps } from "@xyflow/react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { placeOf, useGo, usePlace } from "~/app/place";
import { type Catalog, label } from "~/core/catalog";
import type { Dependency } from "~/core/dependencies";
import type { Address } from "~/core/documents";
import { useBetween, useDependencies } from "~/core/queries";
import { count } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, cn, SectionTitle } from "~/ui/ui";
import { Card, Flow } from "./parts";

type BundleData = { name: string; objects?: number; current: boolean };
type BundleNode = Node<BundleData, "bundle">;

/** Above this many bundles, only those next to the current one are drawn. */
const MOST_DRAWN = 40;

export default function BundleGraph({ catalog }: { catalog: Catalog }) {
  const { b: current } = usePlace();
  const go = useGo();
  const { data: all } = useDependencies();
  const [everything, setEverything] = useState(false);
  const [picked, setPicked] = useState<Dependency>();
  if (!all) return <LoaderCircle className="m-8 size-4 animate-spin text-ink-soft" />;
  if (all.length === 0)
    return <p className="p-8 text-center text-ink-faint">{m.graph_no_dependencies()}</p>;

  const names = [
    ...new Set([...catalog.library.bundles.map(({ name }) => name), ...all.map(({ to }) => to)]),
  ];
  const nearby = current !== undefined && names.length > MOST_DRAWN && !everything;
  const dependencies = nearby
    ? all.filter(({ from, to }) => from === current || to === current)
    : all;
  const drawn = nearby
    ? new Set(dependencies.flatMap(({ from, to }) => [from, to]))
    : new Set(names);
  if (current) drawn.add(current);
  const nodes = [...drawn].map((name) => bundleNode(catalog, name, name === current));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3 text-2xs text-ink-faint">
        {nearby && (
          <>
            {m.graph_nearby({ bundle: current })}
            <button
              type="button"
              onClick={() => setEverything(true)}
              className="text-accent hover:underline"
            >
              {m.graph_everything()}
            </button>
          </>
        )}
        <span className="ms-auto">{m.graph_pick()}</span>
      </div>
      <Flow
        nodes={nodes}
        edges={dependencies.map((dependency) => dependencyEdge(dependency, dependency === picked))}
        nodeTypes={NODE_TYPES}
        onNodeClick={(node: BundleNode) => go({ b: node.data.name, g: "bundles" })}
        onEdgeClick={(edge) => setPicked(dependencies.find((each) => edgeId(each) === edge.id))}
      />
      {picked && picked.count > 0 && (
        <References key={edgeId(picked)} catalog={catalog} dependency={picked} />
      )}
    </div>
  );
}

const NODE_TYPES = { bundle: BundleCard };

function BundleCard({ data }: NodeProps<BundleNode>) {
  const open = data.objects !== undefined;
  return (
    <Card
      className={cn(
        data.current && "border-accent ring-2 ring-accent/30",
        !open && "border-danger/60 border-dashed",
      )}
    >
      <span className="truncate font-mono text-ink" title={data.name}>
        {data.name}
      </span>
      <span className="text-2xs text-ink-faint">
        {open ? m.object_count({ count: data.objects ?? 0 }) : m.graph_not_open()}
      </span>
    </Card>
  );
}

function bundleNode(catalog: Catalog, name: string, current: boolean): BundleNode {
  const bundle = catalog.bundle(name);
  const objects = bundle?.files.reduce((sum, file) => sum + file.objects.length, 0);
  return {
    id: name,
    type: "bundle",
    position: { x: 0, y: 0 },
    width: Math.min(360, Math.max(160, name.length * 7 + 24)),
    height: 44,
    data: { name, objects, current },
  };
}

/** An arrow labelled with its references, dashed when the dependency is only declared. */
function dependencyEdge(dependency: Dependency, picked: boolean): Edge {
  return {
    id: edgeId(dependency),
    source: dependency.from,
    target: dependency.to,
    label: dependency.count > 0 ? count(dependency.count) : m.graph_declared(),
    labelStyle: { fontSize: 10 },
    style: {
      strokeDasharray: dependency.count > 0 ? undefined : "4 3",
      strokeWidth: picked ? 2.5 : 1.25,
      cursor: "pointer",
    },
    markerEnd: { type: MarkerType.ArrowClosed },
  };
}

function edgeId({ from, to }: Dependency): string {
  return `${from}\t${to}`;
}

/** The references behind a dependency, by list, each opening the object that makes it. */
function References({ catalog, dependency }: { catalog: Catalog; dependency: Dependency }) {
  const go = useGo();
  const { data: links = [] } = useBetween(dependency.from, dependency.to);
  return (
    <div className="max-h-[40%] shrink-0 overflow-auto border-t border-line px-4 py-2">
      <SectionTitle>
        {m.graph_between({ from: dependency.from, to: dependency.to })} · {count(dependency.count)}
      </SectionTitle>
      <p className="mb-1 font-mono text-2xs text-ink-faint">
        {dependency.lists.map(([list, n]) => `${list} ×${count(n)}`).join(" · ")}
      </p>
      <ul>
        {links.slice(0, 300).map((link) => (
          <li
            key={`${link.from.file}\n${link.from.id}\n${link.field}`}
            className="flex items-center gap-2"
          >
            <ObjectButton
              catalog={catalog}
              address={link.from}
              onOpen={(address) => go(placeOf(address))}
            />
            <span className="truncate font-mono text-2xs text-ink-faint">{link.field}</span>
            <span className="text-ink-faint">→</span>
            <ObjectButton
              catalog={catalog}
              address={link.to}
              onOpen={(address) => go(placeOf(address))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ObjectButton({
  catalog,
  address,
  onOpen,
}: {
  catalog: Catalog;
  address: Address;
  onOpen: (address: Address) => void;
}) {
  const located = catalog.object(address);
  return (
    <button
      type="button"
      disabled={!located}
      onClick={() => onOpen(address)}
      className="flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-hover disabled:text-ink-faint disabled:hover:bg-transparent"
    >
      {located && <ClassDot name={located.object.class} />}
      <span className="truncate">{located ? label(located.object) : `#${address.id}`}</span>
    </button>
  );
}

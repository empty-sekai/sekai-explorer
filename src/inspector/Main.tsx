// The centre pane: the overview of the current bundle, the inspector of the current object, or
// the current asset.

import { addressOf, useGo, usePlace } from "~/app/place";
import { AssetView } from "~/asset/AssetView";
import type { Catalog } from "~/core/catalog";
import { m } from "~/paraglide/messages.js";
import { cn } from "~/ui/ui";
import { BundleOverview } from "./BundleOverview";
import { ObjectInspector } from "./ObjectInspector";

export function Main({ catalog }: { catalog: Catalog }) {
  const place = usePlace();
  const go = useGo();
  const address = addressOf(place);
  const bundle = place.b ? catalog.bundle(place.b) : undefined;
  const located = address && catalog.object(address);

  const view = place.a ? (
    <AssetView key={place.a} catalog={catalog} name={place.a} />
  ) : located ? (
    <ObjectInspector key={place.o} catalog={catalog} located={located} />
  ) : bundle && !address ? (
    <BundleOverview catalog={catalog} bundle={bundle} />
  ) : (
    <Hint text={place.b ? m.not_found() : m.nothing_selected()} />
  );

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <nav className="flex h-9 shrink-0 items-center gap-1 border-b border-line px-2">
        <Tab
          active={!address && !place.a}
          disabled={!bundle}
          onClick={() => bundle && go({ b: bundle.name })}
        >
          {m.overview()}
        </Tab>
        <Tab active={!!address && !place.a} disabled={!located}>
          {m.inspector()}
        </Tab>
        {place.a && <Tab active>{m.asset()}</Tab>}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto">{view}</div>
    </section>
  );
}

function Tab({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-6 rounded-md px-2.5 text-ink-soft disabled:opacity-40",
        active ? "bg-selected text-ink" : "hover:bg-hover",
      )}
    >
      {children}
    </button>
  );
}

function Hint({ text }: { text: string }) {
  return <p className="p-8 text-center text-ink-faint">{text}</p>;
}

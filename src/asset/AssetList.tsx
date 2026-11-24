// Assets as links: in a bundle's overview, and among the possible assets of an object.

import { useGo, usePlace } from "~/app/place";
import type { PlannedAsset } from "~/core/session";
import { cn } from "~/ui/ui";

export function AssetList({ bundle, assets }: { bundle: string; assets: PlannedAsset[] }) {
  const go = useGo();
  const place = usePlace();
  return (
    <ul className="space-y-0.5">
      {assets.map((asset) => (
        <li key={asset.name}>
          <button
            type="button"
            onClick={() => go({ b: bundle, a: asset.name })}
            className={cn(
              "flex w-full min-w-0 items-center gap-2 rounded px-1 py-1 text-left hover:bg-hover",
              place.a === asset.name && "bg-selected",
            )}
          >
            <FormBadge form={asset.form} />
            <span className="truncate font-mono text-2xs" title={asset.name}>
              {asset.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function FormBadge({ form }: { form: string }) {
  return (
    <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 font-mono text-2xs text-accent">
      {form}
    </span>
  );
}

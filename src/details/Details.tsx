// The right pane: the identity of the current object or bundle, the assets that start at the
// object, and what refers to it.

import { addressOf, placeOf, useGo, usePlace } from "~/app/place";
import { AssetList } from "~/asset/AssetList";
import { type Catalog, type Located, label } from "~/core/catalog";
import { keyOf } from "~/core/documents";
import { useAssets, useReferrers } from "~/core/queries";
import type { BundleSummary } from "~/core/session";
import { bytes, count, short } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, CopyButton, Fact, Pane, SectionTitle } from "~/ui/ui";

export function Details({ catalog }: { catalog: Catalog }) {
  const place = usePlace();
  const address = addressOf(place);
  const located = address && catalog.object(address);
  const bundle = place.b ? catalog.bundle(place.b) : undefined;
  return (
    <Pane title={m.details()}>
      <div className="p-3">
        {located ? (
          <ObjectDetails key={place.o} catalog={catalog} located={located} />
        ) : bundle && !address ? (
          <BundleDetails bundle={bundle} />
        ) : null}
      </div>
    </Pane>
  );
}

function ObjectDetails({ catalog, located }: { catalog: Catalog; located: Located }) {
  const { address, object } = located;
  return (
    <>
      <dl>
        <Fact name={m.class()}>
          <span className="flex items-center gap-1.5">
            <ClassDot name={object.class} />
            {object.class}
          </span>
        </Fact>
        <Fact name={m.class_id()}>{object.classId}</Fact>
        {object.script !== undefined && (
          <Fact name={m.script()}>
            <span className="font-mono text-2xs">{object.script ?? m.script_unresolved()}</span>
          </Fact>
        )}
        <Fact name={m.path_id()}>
          <span className="flex items-center gap-1 font-mono text-2xs">
            {object.id}
            <CopyButton text={object.id} />
          </span>
        </Fact>
        <Fact name={m.bundle()}>
          <span className="font-mono text-2xs">{address.bundle}</span>
        </Fact>
        <Fact name={m.file()}>
          <span className="font-mono text-2xs">{address.file}</span>
        </Fact>
        <Fact name={m.size()}>{bytes(object.size)}</Fact>
      </dl>
      {object.container && (
        <>
          <SectionTitle>{m.container()}</SectionTitle>
          <ul className="space-y-1 font-mono text-2xs break-all text-ink-soft">
            {object.container.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </>
      )}
      <PossibleAssets located={located} />
      <Referrers catalog={catalog} located={located} />
    </>
  );
}

/** The assets that start at the object. */
function PossibleAssets({ located: { address } }: { located: Located }) {
  const { data: assets = [] } = useAssets(address.bundle);
  const rooted = assets.filter(
    (asset) =>
      asset.path_id === address.id && (asset.file === undefined || asset.file === address.file),
  );
  return (
    <>
      <SectionTitle>{m.possible_assets()}</SectionTitle>
      {rooted.length === 0 ? (
        <p className="text-ink-faint">{m.possible_assets_none()}</p>
      ) : (
        <AssetList bundle={address.bundle} assets={rooted} />
      )}
    </>
  );
}

function Referrers({ catalog, located }: { catalog: Catalog; located: Located }) {
  const go = useGo();
  const { data: referrers = [] } = useReferrers(located.address);
  return (
    <>
      <SectionTitle>
        {m.referenced_by()} · {count(referrers.length)}
      </SectionTitle>
      {referrers.length === 0 ? (
        <p className="text-ink-faint">{m.referenced_by_none()}</p>
      ) : (
        <ul>
          {referrers.map(({ from, field }) => {
            const source = catalog.object(from);
            if (!source) return null;
            return (
              <li key={`${keyOf(from)}\n${field}`}>
                <button
                  type="button"
                  onClick={() => go(placeOf(from))}
                  className="flex w-full min-w-0 items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-hover"
                >
                  <ClassDot name={source.object.class} />
                  <span className="truncate">{label(source.object)}</span>
                  <span className="ms-auto shrink-0 truncate font-mono text-2xs text-ink-faint">
                    {field}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function BundleDetails({ bundle }: { bundle: BundleSummary }) {
  const objects = bundle.files.reduce((sum, file) => sum + file.objects.length, 0);
  const total = bundle.entries.reduce((sum, entry) => sum + entry.size, 0);
  const versions = [...new Set(bundle.files.map((file) => file.unityVersion))];
  return (
    <dl>
      <Fact name={m.bundle()}>
        <span className="font-mono text-2xs">{bundle.name}</span>
      </Fact>
      <Fact name={m.entries()}>{count(bundle.entries.length)}</Fact>
      <Fact name={m.objects()}>{count(objects)}</Fact>
      <Fact name={m.size()}>{bytes(total)}</Fact>
      <Fact name={m.unity_version()}>{versions.join(", ")}</Fact>
      {bundle.entries.map((entry) => (
        <Fact key={entry.path} name={entry.path}>
          <span className="font-mono text-2xs text-ink-faint">sha256 {short(entry.sha256)}</span>
        </Fact>
      ))}
    </dl>
  );
}

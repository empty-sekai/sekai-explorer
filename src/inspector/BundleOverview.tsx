// What a bundle holds: the assets made from it first, then the classes of its objects, its
// entries, and the files it depends on.

import { LoaderCircle } from "lucide-react";
import { useGo } from "~/app/place";
import { AssetList } from "~/asset/AssetList";
import type { Catalog } from "~/core/catalog";
import type { External } from "~/core/documents";
import { isBundleFile } from "~/core/documents";
import { useAssets } from "~/core/queries";
import type { BundleSummary } from "~/core/session";
import { bytes, count } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, SectionTitle } from "~/ui/ui";

export function BundleOverview({ catalog, bundle }: { catalog: Catalog; bundle: BundleSummary }) {
  return (
    <div className="max-w-4xl space-y-2 p-4">
      <h1 className="break-all font-mono text-sm">{bundle.name}</h1>
      <Assets bundle={bundle.name} />
      <Classes bundle={bundle} />
      <Entries bundle={bundle} />
      <Externals catalog={catalog} bundle={bundle} />
    </div>
  );
}

function Entries({ bundle }: { bundle: BundleSummary }) {
  return (
    <>
      <SectionTitle>{m.entries()}</SectionTitle>
      <table className="w-full text-left">
        <tbody>
          {bundle.entries.map((entry) => {
            const file = bundle.files.find((f) => f.path === entry.path);
            return (
              <tr key={entry.path} className="border-b border-line align-top">
                <td className="py-1.5 pe-3 font-mono text-2xs break-all">{entry.path}</td>
                <td className="py-1.5 pe-3 whitespace-nowrap text-ink-soft">
                  {entry.kind === "serialized" ? m.entry_serialized() : m.entry_resource()}
                </td>
                <td className="py-1.5 pe-3 whitespace-nowrap text-end tabular-nums">
                  {bytes(entry.size)}
                </td>
                <td className="py-1.5 text-2xs text-ink-faint">
                  {file &&
                    `${m.unity_version()} ${file.unityVersion} · ${m.serialized_version()} ${file.serializedVersion} · ${m.type_trees()} ${file.typeTrees ? m.yes() : m.no()}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** The assets of the defined forms, which are only part of what the bundle holds. */
function Assets({ bundle }: { bundle: string }) {
  const { data: assets } = useAssets(bundle);
  return (
    <>
      <SectionTitle>
        {m.assets()}
        {assets && ` · ${count(assets.length)}`}
      </SectionTitle>
      <p className="mb-1.5 text-2xs text-ink-faint">{m.assets_partial()}</p>
      {!assets ? (
        <LoaderCircle className="size-4 animate-spin text-ink-faint" />
      ) : assets.length === 0 ? (
        <p className="text-ink-faint">{m.assets_none()}</p>
      ) : (
        <AssetList bundle={bundle} assets={assets} />
      )}
    </>
  );
}

function Classes({ bundle }: { bundle: BundleSummary }) {
  const tally = new Map<string, number>();
  for (const file of bundle.files) {
    for (const object of file.objects) tally.set(object.class, (tally.get(object.class) ?? 0) + 1);
  }
  const sorted = [...tally].sort(([, a], [, b]) => b - a);
  const most = sorted[0]?.[1] ?? 1;
  return (
    <>
      <SectionTitle>{m.classes()}</SectionTitle>
      <ul className="space-y-1">
        {sorted.map(([name, n]) => (
          <li key={name} className="grid grid-cols-[12rem_minmax(0,1fr)_4rem] items-center gap-3">
            <span className="flex items-center gap-1.5 truncate">
              <ClassDot name={name} />
              {name}
            </span>
            <span className="h-1.5 rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-ink-faint"
                style={{ width: `${(n / most) * 100}%` }}
              />
            </span>
            <span className="text-end tabular-nums text-ink-soft">{count(n)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Externals({ catalog, bundle }: { catalog: Catalog; bundle: BundleSummary }) {
  const go = useGo();
  const externals = bundle.files.flatMap((file) => file.externals);
  if (externals.length === 0) return null;
  return (
    <>
      <SectionTitle>{m.externals()}</SectionTitle>
      <ul className="space-y-1">
        {externals.map((external) => {
          const target = external.target;
          const isOpen = target && catalog.bundle(target.bundle);
          return (
            <li key={`${external.index}:${external.path}`} className="flex items-center gap-2">
              <span className="w-6 text-end text-2xs text-ink-faint tabular-nums">
                {external.index}
              </span>
              {target ? (
                <button
                  type="button"
                  disabled={!isOpen}
                  onClick={() => go({ b: target.bundle })}
                  className="truncate font-mono text-2xs text-accent hover:underline disabled:text-danger disabled:no-underline"
                >
                  {target.bundle}
                </button>
              ) : (
                <span className="truncate font-mono text-2xs text-ink-soft">{external.path}</span>
              )}
              <span className="text-2xs text-ink-faint">
                {isOpen ? null : missingNote(external)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** What an external whose bundle is not open is: in a bundle still to open, or an engine resource. */
function missingNote(external: External): string {
  return external.target || isBundleFile(external.path)
    ? m.external_not_open()
    : m.external_builtin();
}

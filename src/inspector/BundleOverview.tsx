// What a bundle holds: its entries, the classes of its objects, and the files it depends on.

import { useGo } from "~/app/place";
import type { Catalog } from "~/core/catalog";
import type { BundleSummary } from "~/core/session";
import { bytes, count } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, SectionTitle } from "~/ui/ui";

export function BundleOverview({ catalog, bundle }: { catalog: Catalog; bundle: BundleSummary }) {
  return (
    <div className="max-w-4xl space-y-2 p-4">
      <h1 className="break-all font-mono text-sm">{bundle.name}</h1>
      <Entries bundle={bundle} />
      <Classes bundle={bundle} />
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
                {!target ? m.external_builtin() : !isOpen ? m.external_not_open() : null}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

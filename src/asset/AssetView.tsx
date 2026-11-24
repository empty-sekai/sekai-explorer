// An asset, converted when it is opened: what it is, its files shown as what they are, and the
// objects it was made from next to those it could have read.

import { LoaderCircle } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { placeOf, useGo } from "~/app/place";
import { type Catalog, label } from "~/core/catalog";
import { useClosure, useConverted } from "~/core/queries";
import type { AssetDocument, SourceObject } from "~/core/session";
import { explain } from "~/lib/errors";
import { bytes, count, short } from "~/lib/format";
import { m } from "~/paraglide/messages.js";
import { ClassDot, CopyButton, cn, Fact, SectionTitle } from "~/ui/ui";
import { FormBadge } from "./AssetList";
import { MemberPreview } from "./MemberPreview";

const ClosureGraph = lazy(() => import("~/graph/ClosureGraph"));

export function AssetView({ catalog, name }: { catalog: Catalog; name: string }) {
  const { data: document, isPending, error } = useConverted(name);
  return (
    <div className="max-w-5xl space-y-2 p-4">
      <h1 className="break-all font-mono text-sm">{name}</h1>
      {isPending ? (
        <p className="flex items-center gap-2 text-ink-soft">
          <LoaderCircle className="size-4 animate-spin" />
          {m.converting()}
        </p>
      ) : error ? (
        <p className="text-danger">{String(error)}</p>
      ) : document ? (
        <Converted catalog={catalog} document={document} />
      ) : (
        <p className="text-ink-faint">{m.no_asset()}</p>
      )}
    </div>
  );
}

function Converted({ catalog, document }: { catalog: Catalog; document: AssetDocument }) {
  return (
    <>
      <dl className="max-w-xl">
        <Fact name={m.form()}>
          <FormBadge form={document.form} />
        </Fact>
        <Fact name={m.form_version()}>{document.form_version}</Fact>
        <Fact name={m.fingerprint()}>
          <span className="flex items-center gap-1 font-mono text-2xs">
            {short(document.fingerprint)}
            <CopyButton text={document.fingerprint} />
          </span>
        </Fact>
      </dl>
      {document.error && (
        <div className="rounded-lg border border-danger/40 bg-danger-soft p-3">
          <p className="font-medium text-danger">{m.asset_failed()}</p>
          <p className="mt-1">{explain(document.error.code)}</p>
          <p className="mt-1 font-mono text-2xs text-ink-soft">{document.error.message}</p>
        </div>
      )}
      <Members document={document} />
      <References catalog={catalog} references={document.references} />
      <Sources catalog={catalog} document={document} />
    </>
  );
}

function Members({ document }: { document: AssetDocument }) {
  const [shown, setShown] = useState(0);
  const member = document.members[shown];
  if (!member) return null;
  return (
    <>
      <SectionTitle>
        {m.members()} · {count(document.members.length)}
      </SectionTitle>
      <div className="flex flex-wrap gap-1">
        {document.members.map((each, i) => (
          <button
            key={each.role}
            type="button"
            onClick={() => setShown(i)}
            className={cn(
              "rounded-md border px-2 py-1 text-left",
              i === shown ? "border-accent bg-selected" : "border-line hover:bg-hover",
            )}
          >
            <span className="font-mono text-2xs">{each.role}</span>{" "}
            <span className="text-2xs text-ink-faint">
              {each.extension} · {bytes(each.size)}
            </span>
          </button>
        ))}
      </div>
      <div className="pt-2">
        <MemberPreview key={member.sha256} member={member} document={document} />
      </div>
    </>
  );
}

function References({ catalog, references }: { catalog: Catalog; references: string[] }) {
  const go = useGo();
  if (references.length === 0) return null;
  return (
    <>
      <SectionTitle>{m.referred_assets()}</SectionTitle>
      <ul className="space-y-0.5">
        {references.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => go({ b: catalog.bundleOf(name), a: name })}
              className="truncate font-mono text-2xs text-accent hover:underline"
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The objects the conversion read, then those it could have read and did not, as lists or as one
 * graph.
 */
function Sources({ catalog, document }: { catalog: Catalog; document: AssetDocument }) {
  const { data: closure = [] } = useClosure(document.name);
  const [graph, setGraph] = useState(false);
  const read = new Set(document.sources.map(nameKey));
  const unread = closure.filter((object) => !read.has(nameKey(object)));
  if (document.sources.length + unread.length === 0) return null;
  const toggle = (
    <button
      type="button"
      onClick={() => setGraph(!graph)}
      className="ms-2 font-normal text-accent hover:underline"
    >
      {graph ? m.graph_list() : m.graph_show()}
    </button>
  );
  if (graph) {
    return (
      <>
        <SectionTitle>
          {m.sources_read()} · {count(document.sources.length)} · {m.closure_unread()} ·{" "}
          {count(unread.length)}
          {toggle}
        </SectionTitle>
        <Suspense fallback={<LoaderCircle className="size-4 animate-spin text-ink-soft" />}>
          <ClosureGraph
            catalog={catalog}
            read={document.sources}
            unread={unread}
            home={catalog.bundleOf(document.name) ?? ""}
          />
        </Suspense>
      </>
    );
  }
  return (
    <>
      {document.sources.length > 0 && (
        <>
          <SectionTitle>
            {m.sources_read()} · {count(document.sources.length)}
            {toggle}
          </SectionTitle>
          <ObjectList catalog={catalog} objects={document.sources} />
        </>
      )}
      {unread.length > 0 && (
        <>
          <SectionTitle>
            {m.closure_unread()} · {count(unread.length)}
            {document.sources.length === 0 && toggle}
          </SectionTitle>
          <ObjectList catalog={catalog} objects={unread} />
        </>
      )}
    </>
  );
}

/** How many objects a list shows before it is asked for more. */
const PAGE = 100;

function ObjectList({ catalog, objects }: { catalog: Catalog; objects: SourceObject[] }) {
  const go = useGo();
  const [shown, setShown] = useState(PAGE);
  return (
    <ul className="grid gap-x-4 sm:grid-cols-2">
      {objects.slice(0, shown).map((object) => {
        const located = catalog.named(object);
        return (
          <li key={nameKey(object)}>
            <button
              type="button"
              disabled={!located}
              onClick={() => located && go(placeOf(located.address))}
              className="flex w-full min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-hover disabled:hover:bg-transparent"
            >
              <ClassDot name={object.class} />
              <span className="truncate">{located ? label(located.object) : object.class}</span>
              <span className="ms-auto shrink-0 font-mono text-2xs text-ink-faint">
                {object.path_id}
              </span>
            </button>
          </li>
        );
      })}
      {objects.length > shown && (
        <li>
          <button
            type="button"
            onClick={() => setShown(shown + PAGE)}
            className="px-1 text-accent hover:underline"
          >
            {m.show_more({ count: Math.min(PAGE, objects.length - shown) })}
          </button>
        </li>
      )}
    </ul>
  );
}

function nameKey(object: SourceObject): string {
  return `${object.bundle}\n${object.file ?? ""}\n${object.path_id}`;
}

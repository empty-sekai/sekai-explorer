// One object: who it is, and every field it stores.

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { type Catalog, type Located, label } from "~/core/catalog";
import { useObject } from "~/core/queries";
import { explain } from "~/lib/errors";
import { m } from "~/paraglide/messages.js";
import { ClassDot, CopyButton } from "~/ui/ui";
import { BytesView } from "./BytesView";
import { FieldTree } from "./FieldTree";

export function ObjectInspector({ catalog, located }: { catalog: Catalog; located: Located }) {
  const { address, object: summary } = located;
  const { data: object } = useObject(address);
  const [filter, setFilter] = useState("");

  return (
    <div className="p-4">
      <header className="mb-3 flex items-center gap-2">
        <ClassDot name={summary.class} />
        <h1 className="truncate text-sm font-medium">{label(summary)}</h1>
        <span className="text-ink-soft">{summary.class}</span>
        <span className="font-mono text-2xs text-ink-faint">{summary.id}</span>
        <span className="flex-1" />
        {object && <CopyButton text={JSON.stringify(object, null, 2)} label={m.copy_json()} />}
      </header>
      {object === undefined ? (
        <LoaderCircle className="size-4 animate-spin text-ink-faint" />
      ) : object === null ? null : (
        <>
          {object.error && (
            <div className="mb-3 rounded-lg border border-danger/40 bg-danger-soft p-3">
              <p className="flex items-center gap-1.5 font-medium text-danger">
                <TriangleAlert className="size-4" />
                {m.object_error()} · <span className="font-mono">{object.error.code}</span>
              </p>
              <p className="mt-1 text-ink-soft">{explain(object.error.code)}</p>
              <p className="mt-1 font-mono text-2xs text-ink-faint">{object.error.message}</p>
            </div>
          )}
          {object.fields !== null && (
            <>
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={m.filter_fields()}
                className="mb-2 h-7 w-64 rounded-md border border-line bg-canvas px-2 outline-none placeholder:text-ink-faint focus:border-accent"
              />
              <FieldTree catalog={catalog} from={address} value={object.fields} filter={filter} />
            </>
          )}
          {object.raw && (
            <div className="mt-3">
              <p className="mb-1 text-2xs text-ink-faint">{m.raw_bytes()}</p>
              <BytesView bytes={object.raw} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

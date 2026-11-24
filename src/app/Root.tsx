// The page: the welcome screen until bundles are open, then the workspace. Dropping files
// anywhere on the page opens them.

import { useEffect, useState } from "react";
import { useLocale } from "~/lib/locale";
import { m } from "~/paraglide/messages.js";
import { fromDrop } from "~/sources/pick";
import { useSources } from "~/sources/store";
import { Welcome } from "./Welcome";
import { Workspace } from "./Workspace";

export function Root() {
  // Every message is read during render, so a new language renders the tree anew.
  return <Page key={useLocale()} />;
}

function Page() {
  const catalog = useSources((state) => state.catalog);
  const dragging = useFileDrop();
  return (
    <div className="relative h-full">
      {catalog ? <Workspace catalog={catalog} /> : <Welcome />}
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent-soft/80 text-base font-medium text-accent">
          {m.welcome_drop()}
        </div>
      )}
    </div>
  );
}

/** Opens files dropped on the window; true while files are dragged over it. */
function useFileDrop(): boolean {
  const add = useSources((state) => state.add);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const over = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      setDragging(true);
    };
    const leave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDragging(false);
    };
    const drop = async (event: DragEvent) => {
      if (!event.dataTransfer || !carriesFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      await add(await fromDrop(event.dataTransfer));
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [add]);
  return dragging;
}

// Choosing bundles: files one by one, or a whole folder.

import { Files, FolderOpen } from "lucide-react";
import { useRef } from "react";
import { m } from "~/paraglide/messages.js";
import { fromInput } from "~/sources/pick";
import { useSources } from "~/sources/store";
import { Button, cn } from "~/ui/ui";

/** `quiet` buttons sit in a toolbar; the others lead the welcome screen. */
export function OpenButtons({ quiet = false }: { quiet?: boolean }) {
  const add = useSources((state) => state.add);
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const choose = (input: HTMLInputElement) => {
    if (input.files) add(fromInput(input.files));
    input.value = "";
  };
  return (
    <>
      <Button
        variant={quiet ? "ghost" : "solid"}
        title={m.open_files()}
        onClick={() => filesInput.current?.click()}
      >
        <Files className="size-4" />
        <span className={cn(quiet && "hidden xl:inline")}>{m.open_files()}</span>
      </Button>
      <Button
        variant={quiet ? "ghost" : "outline"}
        title={m.open_folder()}
        onClick={() => folderInput.current?.click()}
      >
        <FolderOpen className="size-4" />
        <span className={cn(quiet && "hidden xl:inline")}>{m.open_folder()}</span>
      </Button>
      <input
        ref={filesInput}
        type="file"
        multiple
        hidden
        onChange={(event) => choose(event.currentTarget)}
      />
      <input
        ref={folderInput}
        type="file"
        hidden
        {...{ webkitdirectory: "" }}
        onChange={(event) => choose(event.currentTarget)}
      />
    </>
  );
}

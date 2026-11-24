// The three panes around the current place: library, main view, details.

import { useState } from "react";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import type { Catalog } from "~/core/catalog";
import { Details } from "~/details/Details";
import { Main } from "~/inspector/Main";
import { Library } from "~/library/Library";
import { CommandPalette } from "./CommandPalette";
import { TopBar } from "./TopBar";

export function Workspace({ catalog }: { catalog: Catalog }) {
  const [searching, setSearching] = useState(false);
  const layout = useDefaultLayout({ id: "workspace", storage: localStorage });
  return (
    <div className="flex h-full flex-col">
      <TopBar catalog={catalog} onSearch={() => setSearching(true)} />
      <Group
        orientation="horizontal"
        className="min-h-0 flex-1"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        <Panel id="library" defaultSize="22" minSize={200}>
          <Library catalog={catalog} />
        </Panel>
        <Divider />
        <Panel id="main" minSize={360}>
          <Main catalog={catalog} />
        </Panel>
        <Divider />
        <Panel id="details" defaultSize="26" minSize={240}>
          <Details catalog={catalog} />
        </Panel>
      </Group>
      <CommandPalette catalog={catalog} open={searching} onOpenChange={setSearching} />
    </div>
  );
}

function Divider() {
  return (
    <Separator className="w-px bg-line transition-colors data-[separator=hover]:bg-accent data-[separator=active]:bg-accent" />
  );
}

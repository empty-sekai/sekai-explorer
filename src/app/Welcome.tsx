// The first screen: what the tool does, and where to put bundles.

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { m } from "~/paraglide/messages.js";
import { useSources } from "~/sources/store";
import { OpenButtons } from "./OpenButtons";
import { Preferences } from "./Preferences";

export function Welcome() {
  const reading = useSources((state) => state.reading);
  const error = useSources((state) => state.error);
  return (
    <main className="flex h-full flex-col">
      <header className="flex h-11 items-center gap-2 px-4">
        <img src="/icon.svg" alt="" className="size-5" />
        <span className="font-medium">{m.app_name()}</span>
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-2xs text-accent">
          {m.experimental()}
        </span>
        <span className="flex-1" />
        <Preferences />
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-dashed border-line-strong bg-surface px-10 py-12 text-center">
          <h1 className="text-xl font-medium">{m.welcome_title()}</h1>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">{m.welcome_body()}</p>
          <div className="mt-6 flex justify-center gap-2">
            {reading ? (
              <span className="inline-flex items-center gap-2 text-ink-soft">
                <LoaderCircle className="size-4 animate-spin" />
                {m.reading()}
              </span>
            ) : (
              <OpenButtons />
            )}
          </div>
          {error && <p className="mt-4 text-danger">{m.read_failed({ reason: error })}</p>}
          <p className="mt-8 inline-flex items-center gap-1.5 text-2xs text-ink-faint">
            <ShieldCheck className="size-3.5" />
            {m.about_privacy()}
          </p>
        </div>
      </div>
      <footer className="pb-4 text-center text-2xs text-ink-faint">{m.app_tagline()}</footer>
    </main>
  );
}

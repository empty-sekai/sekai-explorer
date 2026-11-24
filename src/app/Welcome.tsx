// The first screen: what the tool can do, and where to put bundles.

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { m } from "~/paraglide/messages.js";
import { useSources } from "~/sources/store";
import { OpenButtons } from "./OpenButtons";
import { Preferences } from "./Preferences";

const abilities = [
  m.can_open,
  m.can_browse,
  m.can_bundle,
  m.can_fields,
  m.can_referrers,
  m.can_bytes,
  m.can_jump,
];

export function Welcome() {
  return (
    <main className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center gap-2 px-4">
        <img src="/icon.svg" alt="" className="size-5" />
        <span className="font-medium">{m.app_name()}</span>
        <span className="flex-1" />
        <Preferences />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-auto p-6">
        <DropCard />
        <Abilities />
      </div>
      <footer className="shrink-0 pb-4 text-center text-2xs text-ink-faint">
        {m.app_tagline()}
      </footer>
    </main>
  );
}

function DropCard() {
  const reading = useSources((state) => state.reading);
  const error = useSources((state) => state.error);
  return (
    <section className="w-full max-w-xl rounded-2xl border border-dashed border-line-strong bg-surface px-10 py-12 text-center">
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
    </section>
  );
}

function Abilities() {
  return (
    <section className="w-full max-w-xl px-2">
      <h2 className="text-ink-soft">{m.intro_lead()}</h2>
      <ul className="mt-3 grid gap-x-6 gap-y-2 text-ink-soft sm:grid-cols-2">
        {abilities
          .map((ability) => ability())
          .map((text) => (
            <li key={text} className="flex gap-2">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" />
              {text}
            </li>
          ))}
      </ul>
    </section>
  );
}

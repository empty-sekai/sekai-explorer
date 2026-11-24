// The interface language. Changing it re-renders the interface in place: the open bundles live
// only in this page, so a reload would lose them.

import { useSyncExternalStore } from "react";
import { getLocale, type Locale, locales, setLocale } from "~/paraglide/runtime.js";

export { type Locale, locales };

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale);
}

export function changeLocale(locale: Locale) {
  setLocale(locale, { reload: false });
  document.documentElement.lang = locale;
  for (const listener of listeners) listener();
}

/** Each language's name in that language. */
export function nativeName(locale: Locale): string {
  return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
}

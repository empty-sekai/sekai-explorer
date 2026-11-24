// Light, dark, or following the system, remembered in this browser.

import { useSyncExternalStore } from "react";

export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

const KEY = "theme";
const dark = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function stored(): Theme {
  const value = localStorage.getItem(KEY);
  return themes.find((theme) => theme === value) ?? "system";
}

function apply() {
  const theme = stored();
  const isDark = theme === "dark" || (theme === "system" && dark.matches);
  document.documentElement.classList.toggle("dark", isDark);
  for (const listener of listeners) listener();
}

dark.addEventListener("change", apply);
apply();

export function useTheme(): Theme {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, stored);
}

export function changeTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  apply();
}

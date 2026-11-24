// Checks that every locale defines exactly the messages of the base locale.

import { readFileSync } from "node:fs";

const settings = JSON.parse(readFileSync("project.inlang/settings.json", "utf8"));
const keys = (locale: string) =>
  new Set(
    Object.keys(JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"))).filter(
      (key) => key !== "$schema",
    ),
  );

const base = keys(settings.baseLocale);
let problems = 0;
for (const locale of settings.locales) {
  const own = keys(locale);
  for (const key of base.difference(own)) {
    console.error(`${locale}: missing ${key}`);
    problems++;
  }
  for (const key of own.difference(base)) {
    console.error(`${locale}: ${key} is not in ${settings.baseLocale}`);
    problems++;
  }
}
process.exit(problems === 0 ? 0 : 1);

// Installs the WebAssembly core into src/core/package.
//
// The core is the `sekai-wasm` crate of sekai-exporter, built with
// `wasm-bindgen --target web`. SEKAI_CORE_DIR names the directory that build wrote.
// core.lock.json records the revision and wasm-bindgen version the explorer is tested with.

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const source = process.env.SEKAI_CORE_DIR;
if (!source) {
  console.error("Set SEKAI_CORE_DIR to the output directory of `wasm-bindgen --target web`.");
  process.exit(2);
}
const files = ["sekai_wasm.js", "sekai_wasm.d.ts", "sekai_wasm_bg.wasm"];
const missing = files.filter((file) => !existsSync(join(source, file)));
if (missing.length > 0) {
  console.error(`${source} has no ${missing.join(", ")}`);
  process.exit(1);
}
const target = "src/core/package";
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const file of files) cpSync(join(source, file), join(target, file));
console.log(`core installed from ${source}`);

# Sekai Explorer

English | [简体中文](README.zh-CN.md)

Read the objects inside the game's Unity bundles, right in your browser.

It isn't clear yet what this project is useful for, but it can:

- open bundles, or a whole folder of them, and read them in the browser with the WebAssembly build of [sekai-exporter](https://github.com/StarMoe-org/sekai-exporter)'s core;
- browse every bundle and its objects, filtered by name, class or path ID;
- see a bundle's entries, the classes of its objects, and the bundles its external files resolve to;
- read every field of an object, in stored order, with references as links to the objects they point to, across bundles;
- see which objects refer to an object, and through which field;
- see which assets a bundle or an object can be made into, convert them in the browser, and preview their files (images, sound, video, text and 3D models) next to the objects the conversion read;
- draw the objects around an object, as many references away as asked, as a graph, and the objects an asset could be made from, with those its conversion read set apart;
- open byte payloads as hex;
- jump anywhere with <kbd>Ctrl</kbd> <kbd>K</kbd>, and go back and forward; the URL names the current bundle and object.

Files are read in the browser and never uploaded. The site holds no game data.

Objects are shown as the [object document format](https://github.com/StarMoe-org/sekai-exporter/blob/main/docs/spec/object-documents.md) of sekai-exporter describes them.

The interface is in English, 简体中文, 繁體中文 and 日本語.

## Development

You need [Bun](https://bun.sh), and to build the core, Rust with the `wasm32-unknown-unknown` target and the `wasm-bindgen` CLI of the version in `core.lock.json`.

Build the core from the sekai-exporter revision in `core.lock.json`:

```bash
cargo build --release -p sekai-wasm --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir <core> target/wasm32-unknown-unknown/release/sekai_wasm.wasm
```

Then, in this repository:

```bash
bun install
SEKAI_CORE_DIR=<core> bun run core
bun run dev
```

| Command         | What it does                                        |
| --------------- | --------------------------------------------------- |
| `bun run dev`   | Starts the development server                       |
| `bun run build` | Type-checks and builds the static site into `dist/` |
| `bun run test`  | Runs the unit tests, which use synthetic data only  |
| `bun run check` | Checks formatting and lints with Biome              |
| `bun run i18n`  | Checks that every language has every message        |

Messages live in `messages/<locale>.json`. Interface text always comes from there; numbers, sizes and plurals are formatted with `Intl` for the current language.

## License

[MIT](LICENSE)

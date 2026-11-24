# Sekai Explorer

[English](README.md) | 简体中文

在浏览器里读游戏 Unity 包里的对象。

还不知道这个项目有什么用，但它能做这些：

- 打开资源包或整个文件夹，用 [sekai-exporter](https://github.com/StarMoe-org/sekai-exporter) 核心的 WebAssembly 构建在浏览器里读取；
- 浏览每个包和它的对象，按名字、类或 path ID 筛选；
- 查看包的条目、对象的类分布，以及外部文件解析到的包；
- 按存储顺序读对象的每个字段，引用是指向目标对象的链接，可以跨包；
- 查看哪些对象引用了某个对象，经由哪个字段；
- 查看一个包、一个对象能做成哪些资产，在浏览器里转换，并预览它们的文件（图片、声音、视频、文本和 3D 模型），旁边列出转换读了哪些对象；
- 画出打开的包之间的依赖（包括还没打开的包）；把预制体画成层级，每个 GameObject 连同它的组件和它用到的东西；以及一个资产可能读取的对象，并区分转换实际读了哪些；
- 以十六进制查看字节负载；
- 用 <kbd>Ctrl</kbd> <kbd>K</kbd> 跳到任何地方，前进后退；URL 记录当前的包和对象。

文件只在浏览器里读取，不会上传。站点不含任何游戏数据。

对象按 sekai-exporter 的[对象文档格式](https://github.com/StarMoe-org/sekai-exporter/blob/main/docs/spec/object-documents.zh-CN.md)展示。

界面语言：English、简体中文、繁體中文、日本語。

## 开发

需要 [Bun](https://bun.sh)；构建核心还需要带 `wasm32-unknown-unknown` 目标的 Rust，以及 `core.lock.json` 所写版本的 `wasm-bindgen` 命令行。

用 `core.lock.json` 指定的 sekai-exporter 版本构建核心：

```bash
cargo build --release -p sekai-wasm --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir <core> target/wasm32-unknown-unknown/release/sekai_wasm.wasm
```

然后在本仓库里：

```bash
bun install
SEKAI_CORE_DIR=<core> bun run core
bun run dev
```

| 命令            | 作用                               |
| --------------- | ---------------------------------- |
| `bun run dev`   | 启动开发服务器                     |
| `bun run build` | 类型检查并把静态站点构建到 `dist/` |
| `bun run test`  | 运行单元测试，只用合成数据         |
| `bun run check` | 用 Biome 检查格式与代码            |
| `bun run i18n`  | 检查每种语言是否包含全部文案       |

文案在 `messages/<语言>.json`。界面文字一律取自那里；数字、大小和复数用 `Intl` 按当前语言格式化。

## 许可

[MIT](LICENSE)

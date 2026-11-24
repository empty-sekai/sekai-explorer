// Turns what the user chose or dropped into named bundles.
//
// A bundle is named by its path inside the chosen folder, the way the game names bundles
// (`character/member/res001_no001`); a file chosen on its own is named by its file name.

import type { Source } from "~/core/worker";

/** Files from a file input; with `webkitdirectory`, each carries its path in the folder. */
export function fromInput(files: FileList): Source[] {
  return Array.from(files, (file) => ({
    name: withoutRoot(file.webkitRelativePath) || file.name,
    file,
  }));
}

/** Files and folders dropped on the page, folders read recursively. */
export async function fromDrop(transfer: DataTransfer): Promise<Source[]> {
  // The items are readable only until the drop handler first yields, so take them all now.
  const dropped = Array.from(transfer.items, (item) => ({
    entry: item.webkitGetAsEntry(),
    file: item.getAsFile(),
  }));
  const sources: Source[] = [];
  for (const { entry, file } of dropped) {
    if (entry?.isDirectory) {
      await walk(entry as FileSystemDirectoryEntry, "", sources);
    } else if (file) {
      sources.push({ name: file.name, file });
    }
  }
  return sources;
}

async function walk(directory: FileSystemDirectoryEntry, prefix: string, into: Source[]) {
  for (const entry of await children(directory)) {
    const name = prefix + entry.name;
    if (entry.isDirectory) {
      await walk(entry as FileSystemDirectoryEntry, `${name}/`, into);
    } else {
      into.push({ name, file: await fileOf(entry as FileSystemFileEntry) });
    }
  }
}

/** Every entry of a directory: the reader returns them in batches until an empty one. */
async function children(directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = directory.createReader();
  const all: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((done, fail) =>
      reader.readEntries(done, fail),
    );
    if (batch.length === 0) return all;
    all.push(...batch);
  }
}

function fileOf(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((done, fail) => entry.file(done, fail));
}

function withoutRoot(path: string): string {
  return path.slice(path.indexOf("/") + 1);
}

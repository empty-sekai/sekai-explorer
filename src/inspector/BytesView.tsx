// A byte payload: its size and hash, and on request its bytes in hex.

import { useState } from "react";
import type { Bytes } from "~/core/documents";
import { usePayload } from "~/core/queries";
import { short, bytes as size } from "~/lib/format";
import { m } from "~/paraglide/messages.js";

/** How much of a payload the hex view shows. */
const SHOWN = 4096;
const ROW = 16;

export function BytesView({ bytes: { $bytes } }: { bytes: Bytes }) {
  const [open, setOpen] = useState(false);
  const inline = $bytes.base64;
  const { data: stored } = usePayload($bytes.sha256, open && inline === undefined);
  const data = inline !== undefined ? decode(inline) : stored;
  return (
    <span className="inline-block max-w-full align-top">
      <span className="text-ink-soft">{size($bytes.size)}</span>{" "}
      <span className="text-ink-faint">sha256 {short($bytes.sha256)}</span>{" "}
      {$bytes.size > 0 && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-accent hover:underline"
        >
          {open ? m.bytes_hide() : m.bytes_inline()}
        </button>
      )}
      {open && data && <Hex data={data.subarray(0, SHOWN)} />}
    </span>
  );
}

export function Hex({ data }: { data: Uint8Array }) {
  const offsets = Array.from({ length: Math.ceil(data.length / ROW) }, (_, i) => i * ROW);
  return (
    <pre className="mt-1 max-h-72 overflow-auto rounded-md border border-line bg-canvas p-2 leading-4">
      {offsets.map((offset) => {
        const row = data.subarray(offset, offset + ROW);
        return (
          <div key={offset}>
            <span className="text-ink-faint">{offset.toString(16).padStart(8, "0")}</span>
            {"  "}
            {Array.from(row, (b) => b.toString(16).padStart(2, "0"))
              .join(" ")
              .padEnd(ROW * 3 - 1)}
            {"  "}
            <span className="text-ink-soft">{Array.from(row, printable).join("")}</span>
          </div>
        );
      })}
    </pre>
  );
}

function printable(byte: number): string {
  return byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : "·";
}

function decode(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

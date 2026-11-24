// A file of an asset, shown as what it is: an image, a sound, a video, a model, or text.

import { Download, LoaderCircle } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { fetchMember, useMember } from "~/core/queries";
import type { AssetDocument, Member } from "~/core/session";
import { Hex } from "~/inspector/BytesView";
import { m } from "~/paraglide/messages.js";
import { Button } from "~/ui/ui";
import type { FileOf } from "./viewer";

// three.js is large, so it loads only when a model is shown.
const ModelViewer = lazy(async () => ({ default: (await import("./ModelViewer")).ModelViewer }));

type Kind = "image" | "audio" | "video" | "model" | "json" | "text" | "other";

const KINDS: Record<string, Kind> = {
  png: "image",
  webp: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  avif: "image",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  mp4: "video",
  webm: "video",
  glb: "model",
  json: "json",
  txt: "text",
  csv: "text",
};

/** How much text a preview shows. */
const TEXT_SHOWN = 256 << 10;

/** The member `member` of `document`, whose other members it may name by path, as a model does. */
export function MemberPreview({ member, document }: { member: Member; document: AssetDocument }) {
  const { data: bytes } = useMember(member);
  if (!bytes) return <LoaderCircle className="size-4 animate-spin text-ink-faint" />;
  const kind = KINDS[member.extension.toLowerCase()] ?? "other";
  const type = member.media_type ?? "application/octet-stream";
  const fileOf = async (path: string) => {
    const named = document.members.find((each) => `${each.role}.${each.extension}` === path);
    return named && ((await fetchMember(named)) ?? undefined);
  };
  return (
    <div className="space-y-2">
      <Shown kind={kind} bytes={bytes} type={type} fileOf={fileOf} />
      <Save bytes={bytes} type={type} name={fileName(document.name, member)} />
    </div>
  );
}

function Shown({
  kind,
  bytes,
  type,
  fileOf,
}: {
  kind: Kind;
  bytes: Uint8Array;
  type: string;
  fileOf: FileOf;
}) {
  const url = useUrl(bytes, type);
  switch (kind) {
    case "image":
      return url ? <ImageView url={url} /> : null;
    case "audio":
      // biome-ignore lint/a11y/useMediaCaption: game audio comes without captions.
      return <audio controls src={url} className="w-full" />;
    case "video":
      // biome-ignore lint/a11y/useMediaCaption: game video comes without captions.
      return <video controls src={url} className="max-h-[28rem] max-w-full rounded-lg" />;
    case "model":
      return (
        <Suspense fallback={<LoaderCircle className="size-4 animate-spin text-ink-faint" />}>
          <ModelViewer bytes={bytes} fileOf={fileOf} />
        </Suspense>
      );
    case "json":
    case "text":
      return <TextView bytes={bytes} json={kind === "json"} />;
    case "other":
      return (
        <>
          <p className="text-ink-faint">{m.preview_none()}</p>
          <Hex data={bytes.subarray(0, 4096)} />
        </>
      );
  }
}

function ImageView({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt=""
      className="max-h-[28rem] max-w-full rounded-lg border border-line"
      style={{
        background:
          "repeating-conic-gradient(var(--line) 0 25%, transparent 0 50%) 0 0 / 16px 16px",
      }}
    />
  );
}

function TextView({ bytes, json }: { bytes: Uint8Array; json: boolean }) {
  const truncated = bytes.length > TEXT_SHOWN;
  const text = new TextDecoder().decode(bytes.subarray(0, TEXT_SHOWN));
  return (
    <>
      {truncated && <p className="text-2xs text-ink-faint">{m.preview_truncated()}</p>}
      <pre className="max-h-[32rem] overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-2xs leading-5">
        {json && !truncated ? pretty(text) : text}
      </pre>
    </>
  );
}

function pretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function Save({ bytes, type, name }: { bytes: Uint8Array; type: string; name: string }) {
  const url = useUrl(bytes, type);
  return (
    <Button onClick={() => url && save(url, name)}>
      <Download className="size-3.5" />
      {m.download()}
    </Button>
  );
}

function save(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}

/** The name a saved member gets: the last part of the asset name, its role and extension. */
function fileName(asset: string, member: Member): string {
  return `${asset.slice(asset.lastIndexOf("/") + 1)}.${member.role}.${member.extension}`;
}

/** An object URL for `bytes`, revoked when they change or the component goes. */
function useUrl(bytes: Uint8Array, type: string): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const made = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type }));
    setUrl(made);
    return () => URL.revokeObjectURL(made);
  }, [bytes, type]);
  return url;
}

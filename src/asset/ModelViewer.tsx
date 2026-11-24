// A GLB member, shown in three.js with its textures, its skeleton, a wireframe and its animations.
// The textures are other members of the asset, which the model names by path.

import { useEffect, useRef, useState } from "react";
import { m } from "~/paraglide/messages.js";
import { type FileOf, Viewer } from "./viewer";

export function ModelViewer({ bytes, fileOf }: { bytes: Uint8Array; fileOf: FileOf }) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer>(null);
  const [clips, setClips] = useState<string[]>([]);
  const [failure, setFailure] = useState<string>();

  useEffect(() => {
    if (!host.current) return;
    const shown = new Viewer(host.current);
    viewer.current = shown;
    shown.load(bytes, fileOf).then(setClips, (error) => setFailure(String(error)));
    return () => shown.dispose();
  }, [bytes, fileOf]);

  if (failure) return <p className="text-danger">{m.model_failed({ reason: failure })}</p>;
  return (
    <div className="flex flex-col gap-2">
      <div
        ref={host}
        className="h-[28rem] overflow-hidden rounded-lg border border-line bg-canvas"
      />
      <div className="flex flex-wrap items-center gap-4 text-ink-soft">
        <Toggle label={m.skeleton()} onChange={(on) => viewer.current?.showSkeleton(on)} />
        <Toggle label={m.wireframe()} onChange={(on) => viewer.current?.showWireframe(on)} />
        {clips.length > 0 && (
          <label className="flex items-center gap-1.5">
            {m.animation()}
            <select
              className="h-7 rounded-md border border-line-strong bg-surface px-1.5"
              onChange={(event) => viewer.current?.play(Number(event.target.value))}
            >
              <option value={-1}>{m.animation_none()}</option>
              {clips.map((clip, i) => (
                <option key={clip} value={i}>
                  {clip}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, onChange }: { label: string; onChange: (on: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <input type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

"use client";

import type { CctvCamera } from "@/lib/cctv/types";
import { CctvPlayer } from "./cctv-player";

type Props = {
  camera: CctvCamera;
};

export function CctvCard({ camera }: Props) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-[-0.02em] text-slate-900">
            {camera.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {camera.location}
          </p>
          {camera.description ? (
            <p className="mt-1 text-sm text-slate-400">{camera.description}</p>
          ) : null}
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black",
            camera.enabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {camera.enabled ? "ON" : "OFF"}
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl">
        <CctvPlayer camera={camera} />
      </div>
    </article>
  );
}
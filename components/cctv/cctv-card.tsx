"use client";

import { useRef } from "react";
import { Expand } from "lucide-react";
import type { CctvCamera } from "@/lib/cctv/types";
import { CctvPlayer } from "./cctv-player";

type Props = {
  camera: CctvCamera;
};

export function CctvCard({ camera }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleFullscreen = async () => {
    const el = cardRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await el.requestFullscreen();
    } catch (error) {
      console.error("전체화면 전환 실패:", error);
    }
  };

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black tracking-[-0.02em] text-slate-900">
            {camera.name}
          </h3>
        </div>

        <span
          className={[
            "shrink-0 rounded-full px-3 py-1 text-xs font-black",
            camera.enabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {camera.enabled ? "ON" : "OFF"}
        </span>
      </div>

      <div
        ref={cardRef}
        onClick={handleFullscreen}
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-black"
      >
        <div className="aspect-[16/10] w-full bg-slate-950">
          <CctvPlayer camera={camera} />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFullscreen();
          }}
          className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/50 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/65 active:scale-95"
          aria-label="전체화면"
        >
          <Expand className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
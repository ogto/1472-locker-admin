"use client";

import type { CctvCamera } from "@/lib/cctv/types";
import { CctvCard } from "./cctv-card";

type Props = {
  cameras: CctvCamera[];
};

export function CctvGrid({ cameras }: Props) {
  if (!cameras.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm font-semibold text-slate-500">
        등록된 CCTV가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {cameras.map((camera) => (
        <CctvCard key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
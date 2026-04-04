"use client";

import type { CctvCamera } from "@/lib/cctv/types";

type Props = {
  camera: CctvCamera;
};

export function CctvPlayer({ camera }: Props) {
  if (!camera.streamUrl) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-slate-950 text-sm text-slate-400">
        스트림 주소가 없습니다.
      </div>
    );
  }

  if (camera.streamType === "iframe") {
    return (
      <iframe
        src={camera.streamUrl}
        title={camera.name}
        className="h-full w-full border-0 bg-slate-950"
        allow="autoplay; fullscreen"
      />
    );
  }

  return (
    <div className="flex h-full min-h-[240px] items-center justify-center bg-slate-950 text-sm text-slate-400">
      지원하지 않는 스트림 형식입니다.
    </div>
  );
}
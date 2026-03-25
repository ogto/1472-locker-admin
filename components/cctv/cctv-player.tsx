"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import type { CctvCamera } from "@/lib/cctv/types";

type Props = {
  camera: CctvCamera;
};

export function CctvPlayer({ camera }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [imageKey, setImageKey] = useState(Date.now());

  const imageUrl = useMemo(() => {
    if (camera.streamType !== "image") return camera.streamUrl;
    const separator = camera.streamUrl.includes("?") ? "&" : "?";
    return `${camera.streamUrl}${separator}_ts=${imageKey}`;
  }, [camera.streamType, camera.streamUrl, imageKey]);

  useEffect(() => {
    if (camera.streamType !== "image") return;
    const refreshSeconds = camera.refreshSeconds ?? 3;
    const timer = window.setInterval(() => {
      setImageKey(Date.now());
    }, refreshSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [camera.streamType, camera.refreshSeconds]);

  useEffect(() => {
    if (camera.streamType !== "hls") return;
    if (!videoRef.current) return;
    if (!camera.streamUrl) return;

    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = camera.streamUrl;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
      });
      hls.loadSource(camera.streamUrl);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }
  }, [camera.streamType, camera.streamUrl]);

  if (!camera.streamUrl) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-3xl bg-slate-950 text-sm text-slate-400">
        스트림 주소가 없습니다.
      </div>
    );
  }

  if (camera.streamType === "iframe") {
    return (
      <iframe
        src={camera.streamUrl}
        title={camera.name}
        className="h-full min-h-[240px] w-full rounded-3xl border-0 bg-slate-950"
        allow="autoplay; fullscreen"
      />
    );
  }

  if (camera.streamType === "image") {
    return (
      <div className="overflow-hidden rounded-3xl bg-slate-950">
        <img
          src={imageUrl}
          alt={camera.name}
          className="h-full min-h-[240px] w-full object-cover"
        />
      </div>
    );
  }

  if (camera.streamType === "video") {
    return (
      <video
        src={camera.streamUrl}
        controls
        autoPlay
        muted
        playsInline
        className="h-full min-h-[240px] w-full rounded-3xl bg-slate-950 object-cover"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      muted
      playsInline
      className="h-full min-h-[240px] w-full rounded-3xl bg-slate-950 object-cover"
    />
  );
}
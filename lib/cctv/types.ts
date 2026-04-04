export type CctvStreamType = "hls" | "video" | "image" | "iframe";

export type CctvCamera = {
  id: string;
  name: string;
  enabled: boolean;
  streamType: "iframe" | "image" | "video" | "hls";
  streamUrl: string;
  refreshSeconds?: number;
};
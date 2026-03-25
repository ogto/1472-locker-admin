export type CctvStreamType = "hls" | "video" | "image" | "iframe";

export type CctvCamera = {
  id: string;
  name: string;
  location: string;
  description?: string;
  enabled: boolean;
  streamType: CctvStreamType;
  streamUrl: string;
  refreshSeconds?: number;
};
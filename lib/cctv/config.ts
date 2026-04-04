import type { CctvCamera } from "./types";

const CCTV_BASE_URL =
  "https://closes-zip-butler-revenue.trycloudflare.com";

export const CCTV_CAMERAS: CctvCamera[] = [
  {
    id: "cam-1",
    name: "냉장 구역1",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam1`,
  },
  {
    id: "cam-2",
    name: "보관함 입구",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam2`,
  },
  {
    id: "cam-3",
    name: "보관함 입구2",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam3`,
  },
  {
    id: "cam-4",
    name: "냉장 구역2",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam4`,
  },
  {
    id: "cam-5",
    name: "상온 구역1",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam5`,
  },
  {
    id: "cam-6",
    name: "카운터",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam6`,
  },
  {
    id: "cam-7",
    name: "카페 테리아",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam7`,
  },
  {
    id: "cam-8",
    name: "보관함 입구3",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam8`,
  },
  {
    id: "cam-9",
    name: "엘리베이터",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam9`,
  },
  {
    id: "cam-10",
    name: "케리어 보관함 내부",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam10`,
  },
  {
    id: "cam-11",
    name: "케리어 보관함 입구",
    enabled: true,
    streamType: "iframe",
    streamUrl: `${CCTV_BASE_URL}/stream.html?src=cam11`,
  },
];
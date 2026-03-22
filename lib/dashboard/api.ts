import type { ReserveUserDetailItem, ReserveUserItem } from "./types";

export async function fetchReserveUser(): Promise<ReserveUserItem[]> {
  const res = await fetch("/api/dashboard/reserve-user", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data?.message || "이용중 사용자 조회 실패");
  }

  return Array.isArray(data.data) ? (data.data as ReserveUserItem[]) : [];
}

export async function fetchReserveUserDetail(
  id: number,
  point = "bank"
): Promise<ReserveUserDetailItem[]> {
  const res = await fetch(
    `/api/dashboard/reserve-user-detail?id=${encodeURIComponent(
      String(id)
    )}&point=${encodeURIComponent(point)}`,
    {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data?.message || "상세 조회 실패");
  }

  return Array.isArray(data.data)
    ? (data.data as ReserveUserDetailItem[])
    : [];
}
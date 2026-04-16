import type {
  CancelReserveRequest,
  PickupRequest,
  ReserveUserDetailItem,
  ReserveUserResponse,
} from "./types";

export async function fetchReserveUser(): Promise<ReserveUserResponse> {
  const res = await fetch("/api/dashboard/reserve-user", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data?.message || "이용중 사용자 조회 실패");
  }

  const rawItems = Array.isArray(data.data?.items)
    ? data.data.items
    : Array.isArray(data.data)
    ? data.data
    : [];

  const rawCounts = data.data?.counts ?? {};

  return {
    items: rawItems,
    counts: {
      cold: Number(rawCounts.cold ?? 0),
      room: Number(rawCounts.room ?? 0),
      carrier: Number(rawCounts.carrier ?? 0),
      pickup: Number(rawCounts.pickup ?? 0),
    },
  };
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

export async function postPickup({
  historyIds,
  point,
  reserveId,
}: PickupRequest) {
  const params = new URLSearchParams();

  historyIds.forEach((id) => {
    params.append("historyIds", String(id));
  });
  params.append("point", point);
  params.append("reserveId", String(reserveId));

  const res = await fetch(`/api/dashboard/pickup?${params.toString()}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "픽업 처리 실패");
  }

  return data;
}

export async function postCancelReserve({
  point,
  reserveId,
}: CancelReserveRequest) {
  const params = new URLSearchParams();
  params.set("point", point);
  params.set("reserveId", String(reserveId));

  const res = await fetch(`/api/dashboard/cancel?${params.toString()}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "보관 취소 실패");
  }

  return data;
}

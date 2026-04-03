import type {
  HistoryDetailItem,
  HistoryPageResponse,
  HistorySearchParams,
  HistorySummary,
} from "./types";

export async function fetchReserveHistory(
  params: HistorySearchParams
): Promise<HistoryPageResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("size", String(params.size));

  if (params.point) {
    searchParams.set("point", params.point);
  }

  if (params.reservationStartDay) {
    searchParams.set("reservationStartDay", params.reservationStartDay);
  }

  if (params.reservationEndDay) {
    searchParams.set("reservationEndDay", params.reservationEndDay);
  }

  if (params.searchQuery) {
    searchParams.set("searchQuery", params.searchQuery);
  }

  if (params.reservationStatus) {
    searchParams.set("reservationStatus", params.reservationStatus);
  }

  const response = await fetch(`/api/history?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "이용내역 조회에 실패했습니다.");
  }

  return data;
}

export async function fetchReserveHistorySummary(
  params: Omit<HistorySearchParams, "page" | "size">
): Promise<HistorySummary> {
  const searchParams = new URLSearchParams();

  if (params.point) {
    searchParams.set("point", params.point);
  }

  if (params.reservationStartDay) {
    searchParams.set("reservationStartDay", params.reservationStartDay);
  }

  if (params.reservationEndDay) {
    searchParams.set("reservationEndDay", params.reservationEndDay);
  }

  if (params.searchQuery) {
    searchParams.set("searchQuery", params.searchQuery);
  }

  if (params.reservationStatus) {
    searchParams.set("reservationStatus", params.reservationStatus);
  }

  const response = await fetch(
    `/api/history/summary?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "이용내역 요약 조회에 실패했습니다.");
  }

  return {
    reservationCount: Number(data?.reservationCount || 0),
    storageCount: Number(data?.storageCount || 0),

    coldCount: Number(data?.coldCount || 0),
    roomCount: Number(data?.roomCount || 0),
    carrierCount: Number(data?.carrierCount || 0),
    pickupCount: Number(data?.pickupCount || 0),

    coldCanceledCount: Number(data?.coldCanceledCount || 0),
    roomCanceledCount: Number(data?.roomCanceledCount || 0),
    carrierCanceledCount: Number(data?.carrierCanceledCount || 0),
    pickupCanceledCount: Number(data?.pickupCanceledCount || 0),

    completedCount: Number(data?.completedCount || 0),
    pickupDoneCount: Number(data?.pickupDoneCount || 0),
    pendingCount: Number(data?.pendingCount || 0),
    canceledCount: Number(data?.canceledCount || 0),
  };
}

export async function fetchReserveHistoryDetail(
  id: number,
  point: string
): Promise<HistoryDetailItem[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("id", String(id));
  searchParams.set("point", point);

  const response = await fetch(
    `/api/dashboard/reserve-user-detail?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "이용내역 상세 조회에 실패했습니다.");
  }

  return Array.isArray(result?.data) ? result.data : [];
}
import type {
  HistoryDetailItem,
  HistoryPageResponse,
  HistorySearchParams,
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
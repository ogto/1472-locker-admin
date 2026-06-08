import type {
  ReviewEvent,
  ReviewEventListResponse,
  ReviewEventMutationResponse,
  ReviewEventStatus,
} from "./types";

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "리뷰 이벤트 처리 중 오류가 발생했습니다.");
  }

  return data as T;
}

export async function fetchReviewEvents(params: {
  status?: ReviewEventStatus | "";
  phone?: string;
}): Promise<ReviewEvent[]> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.phone?.trim()) searchParams.set("phone", params.phone.trim());

  const response = await fetch(`/api/reviews?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await readJson<ReviewEventListResponse>(response);
  return Array.isArray(data.items) ? data.items : [];
}

export async function approveReviewEvent(id: number) {
  const response = await fetch(`/api/reviews/${id}/approve`, {
    method: "POST",
    cache: "no-store",
  });

  return readJson<ReviewEventMutationResponse>(response);
}

export async function rejectReviewEvent(id: number, reason: string) {
  const response = await fetch(`/api/reviews/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ reason }),
  });

  return readJson<ReviewEventMutationResponse>(response);
}

export async function markDuplicateReviewEvent(id: number, reason: string) {
  const response = await fetch(`/api/reviews/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ reason }),
  });

  return readJson<ReviewEventMutationResponse>(response);
}

export async function markReviewEventsPaid(ids: number[]) {
  const response = await fetch("/api/reviews/payments/mark-paid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ ids }),
  });

  return readJson<ReviewEventMutationResponse>(response);
}

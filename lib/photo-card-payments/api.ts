import {
  PHOTO_CARD_DEFAULT_ORDER_NAME,
  normalizeAmount,
} from "@/lib/photo-card-payments/config";
import type { PhotoCardPaymentOrder } from "@/lib/photo-card-payments/types";

const CLOUD_API_BASE =
  process.env.PHOTO_CARD_PAYMENT_API_BASE?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

function unwrapPayload(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if ("data" in record) return record.data;
    if ("result" in record) return record.result;
    if ("payload" in record) return record.payload;
  }

  return payload;
}

function toPaymentOrder(payload: unknown): PhotoCardPaymentOrder | null {
  const raw = unwrapPayload(payload);

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const orderId = String(record.orderId || "").trim();

  if (!orderId) {
    return null;
  }

  return {
    amount: normalizeAmount(record.amount as string | number | undefined),
    customerKey:
      String(record.customerKey || "").trim() ||
      `photo-card-${orderId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 50),
    orderId,
    orderName: String(record.orderName || "").trim() || PHOTO_CARD_DEFAULT_ORDER_NAME,
    status:
      record.status === "PAID" ||
      record.status === "FAILED" ||
      record.status === "CANCELED"
        ? record.status
        : "PENDING",
  };
}

export async function fetchPhotoCardPaymentOrder(orderId: string) {
  const response = await fetch(
    `${CLOUD_API_BASE}/payments/photo-card/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`photo-card payment order API ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return toPaymentOrder(payload);
}

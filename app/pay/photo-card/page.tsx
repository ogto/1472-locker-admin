import {
  PHOTO_CARD_DEFAULT_ORDER_NAME,
  PHOTO_CARD_TOSS_CLIENT_KEY,
  normalizeAmount,
} from "@/lib/photo-card-payments/config";
import type { PhotoCardPaymentOrder } from "@/lib/photo-card-payments/types";
import { PhotoCardPaymentClient } from "./photo-card-payment-client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildOrder(searchParams: Record<string, string | string[] | undefined>): PhotoCardPaymentOrder {
  const orderId =
    firstParam(searchParams.orderId)?.trim() ||
    `photo_card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const amount = normalizeAmount(firstParam(searchParams.amount));
  const orderName =
    firstParam(searchParams.orderName)?.trim() || PHOTO_CARD_DEFAULT_ORDER_NAME;

  return {
    amount,
    customerKey: `photo-card-${orderId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 50),
    orderId,
    orderName,
    status: "PENDING",
  };
}

export default async function PhotoCardPaymentPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <PhotoCardPaymentClient
      clientKey={PHOTO_CARD_TOSS_CLIENT_KEY}
      initialOrder={buildOrder(resolvedSearchParams)}
    />
  );
}

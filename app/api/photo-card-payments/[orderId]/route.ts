import { NextRequest, NextResponse } from "next/server";
import { fetchPhotoCardPaymentOrder } from "@/lib/photo-card-payments/api";
import { PHOTO_CARD_DEFAULT_AMOUNT, PHOTO_CARD_DEFAULT_ORDER_NAME } from "@/lib/photo-card-payments/config";

function buildPendingOrder(orderId: string) {
  return {
    amount: PHOTO_CARD_DEFAULT_AMOUNT,
    customerKey: `photo-card-${orderId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 50),
    orderId,
    orderName: PHOTO_CARD_DEFAULT_ORDER_NAME,
    status: "PENDING" as const,
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/photo-card-payments/[orderId]">,
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { ok: false, message: "orderId가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const cloudOrder = await fetchPhotoCardPaymentOrder(orderId);

    if (cloudOrder) {
      return NextResponse.json({ ok: true, order: cloudOrder });
    }
  } catch {
    // The payment page may not have created the pending row yet.
  }

  return NextResponse.json({ ok: true, order: buildPendingOrder(orderId) });
}

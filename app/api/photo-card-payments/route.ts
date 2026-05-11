import { NextRequest, NextResponse } from "next/server";

import {
  PHOTO_CARD_DEFAULT_ORDER_NAME,
  normalizeAmount,
} from "@/lib/photo-card-payments/config";

const CLOUD_API_BASE =
  process.env.PHOTO_CARD_PAYMENT_API_BASE?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

function buildOrder(payload: Record<string, unknown>) {
  const orderId = String(payload.orderId || "").trim();

  return {
    amount: normalizeAmount(payload.amount as string | number | undefined),
    customerKey: `photo-card-${orderId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 50),
    orderId,
    orderName: String(payload.orderName || "").trim() || PHOTO_CARD_DEFAULT_ORDER_NAME,
    status:
      payload.status === "PAID" ||
      payload.status === "FAILED" ||
      payload.status === "CANCELED"
        ? payload.status
        : "PENDING",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orderId = String(body.orderId || "").trim();
    const amount = normalizeAmount(body.amount as string | number | undefined);
    const orderName = String(body.orderName || "").trim() || PHOTO_CARD_DEFAULT_ORDER_NAME;

    if (!orderId || amount <= 0) {
      return NextResponse.json(
        { ok: false, message: "결제 생성 정보가 없습니다." },
        { status: 400 },
      );
    }

    const response = await fetch(`${CLOUD_API_BASE}/payments/photo-card`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify({ orderId, amount, orderName }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "포토카드 결제 생성에 실패했습니다." },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, order: buildOrder(payload) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "포토카드 결제 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

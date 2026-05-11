import { NextRequest, NextResponse } from "next/server";

const CLOUD_API_BASE =
  process.env.PHOTO_CARD_PAYMENT_API_BASE?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

async function confirmWithCloud(paymentCond: { amount: number; orderId: string; paymentKey: string }) {
  const response = await fetch(CLOUD_API_BASE + "/payments/photo-card/test/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    body: JSON.stringify(paymentCond),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof payload === "string"
        ? payload || "결제 승인에 실패했습니다."
        : String((payload as Record<string, unknown>)?.message || "결제 승인에 실패했습니다."),
    );
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const paymentKey = String(body.paymentKey || "").trim();
    const orderId = String(body.orderId || "").trim();
    const amount = Number(body.amount || 0);

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { ok: false, message: "결제 승인 정보가 없습니다." },
        { status: 400 },
      );
    }

    const paymentCond = { amount, orderId, paymentKey };

    const payment = await confirmWithCloud(paymentCond);
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "결제 승인 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const CLOUD_API_BASE =
  process.env.PHOTO_CARD_PAYMENT_API_BASE?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

const TOSS_SECRET_KEY =
  process.env.PHOTO_CARD_TOSS_SECRET_KEY?.trim() ||
  process.env.PHOTO_CARD_TOSS_TEST_SECRET_KEY?.trim() ||
  process.env.HEALTH_BOX_TOSS_SECRET_KEY?.trim() ||
  process.env.HEALTH_BOX_TOSS_TEST_SECRET_KEY?.trim() ||
  "test_gsk_Z61JOxRQVE2oX5jJx6LwrW0X9bAq";

function encodeAuthorization(secretKey: string) {
  return "Basic " + Buffer.from(secretKey + ":", "utf8").toString("base64");
}

function receiptUrl(payment: Record<string, unknown>) {
  const receipt =
    payment.receipt && typeof payment.receipt === "object"
      ? (payment.receipt as Record<string, unknown>)
      : null;

  return String(receipt?.url || "").trim();
}

async function confirmWithCloud(paymentCond: { amount: number; orderId: string; paymentKey: string }) {
  const response = await fetch(CLOUD_API_BASE + "/payments/test/confirm", {
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

async function confirmWithToss(paymentCond: { amount: number; orderId: string; paymentKey: string }) {
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: encodeAuthorization(TOSS_SECRET_KEY),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentCond),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(payload?.message || "결제 승인에 실패했습니다."));
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

    try {
      const payment = await confirmWithCloud(paymentCond);
      return NextResponse.json({ ok: true, payment });
    } catch (cloudError) {
      const payment = await confirmWithToss(paymentCond);
      return NextResponse.json({
        ok: true,
        payment,
        receiptUrl: receiptUrl(payment),
        warning: cloudError instanceof Error ? cloudError.message : String(cloudError),
      });
    }
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

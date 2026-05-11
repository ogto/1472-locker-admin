import { NextRequest, NextResponse } from "next/server";

const TOSS_TEST_SECRET_KEY =
  process.env.PHOTO_CARD_TOSS_TEST_SECRET_KEY?.trim() ||
  process.env.HEALTH_BOX_TOSS_TEST_SECRET_KEY?.trim() ||
  "test_gsk_Z61JOxRQVE2oX5jJx6LwrW0X9bAq";

function encodeAuthorization(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`, "utf8").toString("base64")}`;
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

    if (!TOSS_TEST_SECRET_KEY.startsWith("test_")) {
      return NextResponse.json(
        { ok: false, message: "테스트 결제에는 Toss 테스트 시크릿 키만 사용할 수 있습니다." },
        { status: 500 },
      );
    }

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: encodeAuthorization(TOSS_TEST_SECRET_KEY),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      cache: "no-store",
    });
    const payload = await tossResponse.json().catch(() => ({}));

    if (!tossResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: String(payload?.message || "테스트 결제 승인에 실패했습니다."),
          detail: payload,
        },
        { status: tossResponse.status },
      );
    }

    return NextResponse.json({ ok: true, payment: payload });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "테스트 결제 승인 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

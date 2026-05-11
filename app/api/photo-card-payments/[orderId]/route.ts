import { NextRequest, NextResponse } from "next/server";
import { fetchPhotoCardPaymentOrder } from "@/lib/photo-card-payments/api";
import { PHOTO_CARD_DEFAULT_AMOUNT, PHOTO_CARD_DEFAULT_ORDER_NAME } from "@/lib/photo-card-payments/config";

const TOSS_SECRET_KEY =
  process.env.PHOTO_CARD_TOSS_SECRET_KEY?.trim() ||
  process.env.PHOTO_CARD_TOSS_TEST_SECRET_KEY?.trim() ||
  process.env.HEALTH_BOX_TOSS_SECRET_KEY?.trim() ||
  process.env.HEALTH_BOX_TOSS_TEST_SECRET_KEY?.trim() ||
  "test_gsk_Z61JOxRQVE2oX5jJx6LwrW0X9bAq";

function encodeAuthorization(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`, "utf8").toString("base64")}`;
}

function buildPendingOrder(orderId: string) {
  return {
    amount: PHOTO_CARD_DEFAULT_AMOUNT,
    customerKey: `photo-card-${orderId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 50),
    orderId,
    orderName: PHOTO_CARD_DEFAULT_ORDER_NAME,
    status: "PENDING" as const,
  };
}

async function fetchTossPaymentOrder(orderId: string) {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: encodeAuthorization(TOSS_SECRET_KEY),
        Accept: "application/json",
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    return null;
  }

  return payload;
}

function mapTossStatus(status: unknown) {
  if (status === "DONE") return "PAID" as const;
  if (status === "CANCELED" || status === "PARTIAL_CANCELED") return "CANCELED" as const;
  if (status === "ABORTED" || status === "EXPIRED") return "FAILED" as const;
  return "PENDING" as const;
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
    const order = await fetchPhotoCardPaymentOrder(orderId);

    if (order) {
      return NextResponse.json({ ok: true, order });
    }
  } catch {
    // The kiosk can create ad-hoc Toss payment URLs before the cloud order API stores them.
  }

  const tossPayment = await fetchTossPaymentOrder(orderId);
  const pendingOrder = buildPendingOrder(orderId);

  if (!tossPayment) {
    return NextResponse.json({ ok: true, order: pendingOrder });
  }

  return NextResponse.json({
    ok: true,
    order: {
      ...pendingOrder,
      amount: Number(tossPayment.totalAmount || tossPayment.balanceAmount || pendingOrder.amount),
      status: mapTossStatus(tossPayment.status),
    },
  });
}

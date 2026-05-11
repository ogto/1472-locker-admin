import { NextRequest, NextResponse } from "next/server";
import { fetchPhotoCardPaymentOrder } from "@/lib/photo-card-payments/api";

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

    if (!order) {
      return NextResponse.json(
        { ok: false, message: "결제 정보를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "결제 정보 조회 API가 아직 준비되지 않았습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

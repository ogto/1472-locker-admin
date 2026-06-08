import { NextRequest, NextResponse } from "next/server";
import {
  getReviewBotAdminToken,
  getReviewBotBaseUrl,
  requireAdminSession,
} from "@/lib/reviews/server";

export async function GET(req: NextRequest) {
  if (!requireAdminSession(req)) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const adminToken = getReviewBotAdminToken();

  if (!adminToken) {
    return NextResponse.json(
      { ok: false, message: "REVIEW_BOT_ADMIN_TOKEN 설정이 필요합니다." },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${getReviewBotBaseUrl()}/api/admin/review-events/payments.xlsx`,
    {
      headers: {
        "X-Admin-Token": adminToken,
        "X-Admin-User": "locker-admin",
      },
      cache: "no-store",
    }
  );

  const file = await response.arrayBuffer();

  return new NextResponse(file, {
    status: response.status,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=review-event-payments.xlsx",
    },
  });
}

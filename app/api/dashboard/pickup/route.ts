import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export async function POST(req: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_SESSION_TOKEN;
    const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
    const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const allowedTokens = [adminToken, superAdminToken].filter(Boolean);

    if (!cookieValue || !allowedTokens.includes(cookieValue)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const historyIds = searchParams.getAll("historyIds");
    const point = searchParams.get("point") ?? "bank";
    const reserveId = searchParams.get("reserveId");
    const force = searchParams.get("force");

    if (!historyIds.length || !reserveId) {
      return NextResponse.json(
        { ok: false, message: "historyIds, reserveId는 필수입니다." },
        { status: 400 }
      );
    }

    const upstream = new URL(
      "https://cloud.1472.ai:18443/api/v4/bread-storage/pickup"
    );

    historyIds.forEach((id) => upstream.searchParams.append("historyIds", id));
    upstream.searchParams.set("point", point);
    upstream.searchParams.set("reserveId", reserveId);
    if (force === "true") {
      upstream.searchParams.set("force", "true");
    }

    const response = await fetch(upstream.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    const rawText = await response.text();

    let parsedData: unknown = null;

    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = rawText;
    }

    const emptyPickupResult =
      response.ok && Array.isArray(parsedData) && parsedData.length === 0;

    if (emptyPickupResult) {
      return NextResponse.json(
        {
          ok: false,
          status: 409,
          data: parsedData,
          message:
            "픽업완료 처리된 보관함이 없습니다. 추가금 결제가 필요하거나 이미 처리된 상태일 수 있습니다.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data: parsedData,
        message: response.ok ? "픽업 처리 완료" : "픽업 처리 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "픽업 처리 실패",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

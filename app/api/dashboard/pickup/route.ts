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
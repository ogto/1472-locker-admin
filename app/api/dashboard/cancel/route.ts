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
    const point = searchParams.get("point") ?? "bank";
    const reserveId = searchParams.get("reserveId");

    if (!reserveId) {
      return NextResponse.json(
        { ok: false, message: "reserveId는 필수입니다." },
        { status: 400 }
      );
    }

    const upstream = new URL(
      `https://cloud.1472.ai:18443/api/v4/bread-storage/reserve-cancel/${encodeURIComponent(
        point
      )}/${encodeURIComponent(reserveId)}`
    );
    upstream.searchParams.set("model", "web");

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
        message: response.ok ? "보관 취소 완료" : "보관 취소 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "보관 취소 실패",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

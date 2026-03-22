import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;
    const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionToken || cookieValue !== sessionToken) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const point = searchParams.get("point") || "bank";

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "id가 필요합니다." },
        { status: 400 }
      );
    }

    const url = `https://cloud.1472.ai:18443/api/v4/bread-storage/reserve-user-detail?id=${encodeURIComponent(
      id
    )}&point=${encodeURIComponent(point)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    const rawText = await response.text();

    let parsedData: unknown = [];

    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = [];
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data: Array.isArray(parsedData) ? parsedData : [],
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "상세 조회 중 서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
        data: [],
      },
      { status: 500 }
    );
  }
}
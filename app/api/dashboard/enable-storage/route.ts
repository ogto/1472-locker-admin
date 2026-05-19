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
    const point = searchParams.get("point") || "bank";
    const pickupProduct = searchParams.get("pickupProduct") || "";

    if (point !== "bank") {
      return NextResponse.json(
        { ok: false, message: "지원하지 않는 지점입니다.", data: [] },
        { status: 400 }
      );
    }

    const upstream = new URL(
      "https://cloud.1472.ai:18443/api/v4/bread-storage/enable-storage"
    );
    upstream.searchParams.set("point", point);

    if (pickupProduct) {
      upstream.searchParams.set("pickupProduct", pickupProduct);
    }

    const response = await fetch(upstream.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let parsedData: unknown = rawText;

    if (rawText && contentType.includes("application/json")) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = [];
      }
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
        message: "사용중 보관함 조회 중 서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
        data: [],
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const point = searchParams.get("point") || "bank";
    const storageId = searchParams.get("storageId");

    if (!storageId) {
      return NextResponse.json(
        {
          ok: false,
          message: "storageId가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const upstream = new URL(
      `${BASE_URL}/v4/bread-storage/history/today-by-storage`
    );
    upstream.searchParams.set("point", point);
    upstream.searchParams.set("storageId", storageId);

    const response = await fetch(upstream.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    const text = await response.text();

    let parsedData: unknown = [];

    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = [];
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data: Array.isArray(parsedData) ? parsedData : [],
        message: response.ok
          ? "보관함 히스토리 조회 완료"
          : "보관함 히스토리 조회 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "보관함 히스토리 프록시 호출 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}

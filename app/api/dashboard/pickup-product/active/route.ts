import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const point = searchParams.get("point") || "bank";

    const upstream = new URL(`${BASE_URL}/v4/bread-storage/pickup-product/active`);
    upstream.searchParams.set("point", point);

    const response = await fetch(upstream.toString(), {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "야구장픽업 진행 현황 조회에 실패했습니다.",
          detail: text,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : []);
  } catch (error) {
    return NextResponse.json(
      {
        message: "야구장픽업 진행 현황 프록시 호출 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}

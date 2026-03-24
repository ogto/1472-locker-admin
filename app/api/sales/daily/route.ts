import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const date = searchParams.get("date");
  const point = searchParams.get("point") || "sungsim";

  if (!date) {
    return NextResponse.json(
      { message: "date는 필수입니다." },
      { status: 400 },
    );
  }

  const target = `${API_BASE}/v4/sales-info/daily?date=${encodeURIComponent(
    date,
  )}&point=${encodeURIComponent(point)}`;

  try {
    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "일별 매출 API 호출 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
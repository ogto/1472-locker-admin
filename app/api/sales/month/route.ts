import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const point = searchParams.get("point") || "sungsim";

  if (!year || !month) {
    return NextResponse.json(
      { message: "year, month는 필수입니다." },
      { status: 400 },
    );
  }

  const target = `${API_BASE}/v4/sales-info/month?year=${encodeURIComponent(
    year,
  )}&month=${encodeURIComponent(month)}&point=${encodeURIComponent(point)}`;

  try {
    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "월별 매출 API 호출 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
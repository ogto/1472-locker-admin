import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { message: "year, month는 필수입니다." },
      { status: 400 },
    );
  }

  const target = `${API_BASE}/v4/sales-info/photo-card/month?year=${encodeURIComponent(
    year,
  )}&month=${encodeURIComponent(month)}`;

  try {
    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "사진매출 월별 API 호출 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const point = searchParams.get("point") || "bank";

  if (point !== "bank" && point !== "baseball") {
    return NextResponse.json(
      { message: "선결제 조회는 은행점과 야구장점만 지원합니다." },
      { status: 400 },
    );
  }

  const target = `${API_BASE}/v4/sales-info/prepaid-summary?point=${encodeURIComponent(
    point,
  )}`;

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
      { message: "선결제 API 호출 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

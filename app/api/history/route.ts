import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://cloud.1472.ai:18443/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") || "0";
    const size = searchParams.get("size") || "20";
    const point = searchParams.get("point") || "bank";
    const reservationStartDay = searchParams.get("reservationStartDay") || "";
    const reservationEndDay = searchParams.get("reservationEndDay") || "";
    const searchQuery = searchParams.get("searchQuery") || "";

    const upstreamParams = new URLSearchParams();
    upstreamParams.set("page", page);
    upstreamParams.set("size", size);
    upstreamParams.set("point", point);

    if (reservationStartDay) {
      upstreamParams.set("reservationStartDay", reservationStartDay);
    }

    if (reservationEndDay) {
      upstreamParams.set("reservationEndDay", reservationEndDay);
    }

    if (searchQuery) {
      upstreamParams.set("searchQuery", searchQuery);
    }

    const response = await fetch(
      `${BASE_URL}/v4/bread-storage/reserve-history?${upstreamParams.toString()}`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "이용내역 조회에 실패했습니다.",
          detail: text,
        },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        {
          message: "응답 파싱에 실패했습니다.",
          detail: text,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "이용내역 프록시 호출 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
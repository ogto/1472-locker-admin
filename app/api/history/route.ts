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
    const reservationStatus = searchParams.get("reservationStatus") || "";
    const reservationTime = searchParams.get("reservationTime") || "";
    const pickupProduct = searchParams.get("pickupProduct") || "";
    const sortBy = searchParams.get("sortBy") || "";
    const sortDir = searchParams.get("sortDir") || "";

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

    if (reservationStatus) {
      upstreamParams.set("reservationStatus", reservationStatus);
    }

    if (reservationTime) {
      upstreamParams.set("reservationTime", reservationTime);
    }

    if (pickupProduct) {
      upstreamParams.set("pickupProduct", pickupProduct);
    }

    if (sortBy) {
      upstreamParams.set("sortBy", sortBy);
    }

    if (sortDir) {
      upstreamParams.set("sortDir", sortDir);
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

    return NextResponse.json(JSON.parse(text));
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

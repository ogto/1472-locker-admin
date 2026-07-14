import { NextRequest, NextResponse } from "next/server";
import {
  getSalesCarryoverSummary,
  isCarryoverPoint,
} from "@/lib/sales/carryover-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const point = searchParams.get("point") || "";

  if (
    !Number.isInteger(year) ||
    year < 2020 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !isCarryoverPoint(point)
  ) {
    return NextResponse.json(
      { message: "올바른 year, month, point가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getSalesCarryoverSummary(year, month, point));
  } catch (error) {
    return NextResponse.json(
      {
        message: "이월금액을 불러오지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

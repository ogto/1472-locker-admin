import { NextRequest, NextResponse } from "next/server";
import { getSalesSettlementData, isValidSettlementPeriod } from "@/lib/sales/settlement-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!isValidSettlementPeriod(year, month)) {
    return NextResponse.json({ message: "올바른 year, month가 필요합니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getSalesSettlementData(year, month));
  } catch (error) {
    return NextResponse.json(
      {
        message: "월 정산 데이터를 생성하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

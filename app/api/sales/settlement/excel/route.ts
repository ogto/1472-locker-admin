import { NextRequest, NextResponse } from "next/server";
import { getSalesSettlementData, isValidSettlementPeriod } from "@/lib/sales/settlement-server";
import { buildSettlementXlsx } from "@/lib/sales/settlement-xlsx";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!isValidSettlementPeriod(year, month)) {
    return NextResponse.json({ message: "올바른 year, month가 필요합니다." }, { status: 400 });
  }

  try {
    const data = await getSalesSettlementData(year, month);
    const file = buildSettlementXlsx(data);
    const filename = `${year}년_${month}월_매출_전체.xlsx`;

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="sales-settlement-${year}-${String(month).padStart(2, "0")}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "월 정산 엑셀을 생성하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

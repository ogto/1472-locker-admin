"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { getSalesSettlement } from "@/lib/sales/api";
import type {
  SalesSettlementData,
  SettlementDailyRow,
  SettlementPickupDailyRow,
} from "@/lib/sales/types";

type Props = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const won = new Intl.NumberFormat("ko-KR");

function amount(value: number) {
  return `${won.format(value)}원`;
}

function sum<T>(rows: T[], getter: (row: T) => number) {
  return rows.reduce((total, row) => total + getter(row), 0);
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm font-bold text-slate-400">
        해당 월 데이터가 없습니다.
      </td>
    </tr>
  );
}

function DailyTable({
  title,
  rows,
  storage = false,
}: {
  title: string;
  rows: SettlementDailyRow[] | SettlementPickupDailyRow[];
  storage?: boolean;
}) {
  const totalAmount = sum(rows, (row) => row.amount);
  const totalCount = sum(rows, (row) => row.count);
  const storageTotal = storage
    ? sum(rows as SettlementPickupDailyRow[], (row) => row.storageFee)
    : 0;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-4 py-3 text-center text-lg font-black text-slate-900">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead className="bg-amber-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-center font-black">날짜</th>
              <th className="px-3 py-2 text-right font-black">금액</th>
              <th className="px-3 py-2 text-right font-black">건수</th>
              {storage ? <th className="px-3 py-2 text-right font-black">보관비</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 text-center font-semibold text-slate-600">{row.date}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-slate-800">{won.format(row.amount)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-600">{won.format(row.count)}</td>
                  {storage ? (
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-600">
                      {won.format((row as SettlementPickupDailyRow).storageFee)}
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={storage ? 4 : 3} />
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-800 bg-slate-50 font-black text-slate-900">
            <tr>
              <td className="px-3 py-3 text-center">총 매출</td>
              <td className="px-3 py-3 text-right">{amount(totalAmount)}</td>
              <td className="px-3 py-3 text-right">{won.format(totalCount)}건</td>
              {storage ? <td className="px-3 py-3 text-right">{amount(storageTotal)}</td> : null}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function SalesSettlementTables({ year, month, onPrevMonth, onNextMonth }: Props) {
  const [data, setData] = useState<SalesSettlementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const nextData = await getSalesSettlement({ year, month });
      if (currentRequest === requestId.current) setData(nextData);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setData(null);
        setError(cause instanceof Error ? cause.message : "정산 데이터를 불러오지 못했습니다.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadExcel = useCallback(async () => {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch(`/api/sales/settlement/excel?year=${year}&month=${month}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || "정산 엑셀을 생성하지 못했습니다.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${year}년_${month}월_매출_전체.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "정산 엑셀을 생성하지 못했습니다.");
    } finally {
      setDownloading(false);
    }
  }, [year, month]);

  const categoryTotals = useMemo(() => {
    const rows = data?.pickupDaily ?? [];
    return {
      coldCount: sum(rows, (row) => row.coldCount),
      coldAmount: sum(rows, (row) => row.coldAmount),
      roomCount: sum(rows, (row) => row.roomCount),
      roomAmount: sum(rows, (row) => row.roomAmount),
      carrierCount: sum(rows, (row) => row.carrierCount),
      carrierAmount: sum(rows, (row) => row.carrierAmount),
      count: sum(rows, (row) => row.count),
      amount: sum(rows, (row) => row.amount),
    };
  }, [data]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <section className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-500">월 정산표</div>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-900">{year}년 {month}월 매출</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onPrevMonth} className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            <ChevronLeft size={18} /> 이전 달
          </button>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-50">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> 새로고침
          </button>
          <button type="button" onClick={() => void downloadExcel()} disabled={downloading || loading} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50">
            <Download size={17} /> {downloading ? "엑셀 생성 중" : "엑셀 다운로드"}
          </button>
          <button type="button" onClick={onNextMonth} className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            다음 달 <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div> : null}
      {loading && !data ? <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">월 정산 데이터를 계산하는 중입니다.</div> : null}

      {data ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <DailyTable title="은행점 총 매출" rows={data.bank} />
            <DailyTable title="야구장 픽업 매출" rows={data.pickupDaily} storage />
            <DailyTable title="야구장점 총 매출" rows={data.baseball} />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)]">
            <DailyTable title="은행점 인생네컷 매출" rows={data.photoCard} />

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <h3 className="border-b border-slate-200 px-4 py-3 text-center text-lg font-black text-slate-900">야구장 픽업 매출 상세 리스트</h3>
              <div className="max-h-[720px] overflow-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="sticky top-0 bg-amber-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-center font-black">날짜</th>
                      <th className="px-3 py-2 text-right font-black">금액</th>
                      <th className="px-3 py-2 text-center font-black">구분</th>
                      <th className="px-3 py-2 text-right font-black">예약 ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.pickupLedger.length ? data.pickupLedger.map((row) => (
                      <tr key={`${row.id}-${row.type}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center font-semibold text-slate-600">{row.date}</td>
                        <td className={`px-3 py-2 text-right font-bold ${row.amount < 0 ? "text-rose-600" : "text-slate-800"}`}>{won.format(row.amount)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-slate-600">{row.type === "cancel" ? "취소" : "결제"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-600">{row.reserveId}</td>
                      </tr>
                    )) : <EmptyRow colSpan={4} />}
                  </tbody>
                  <tfoot className="sticky bottom-0 border-t-2 border-slate-800 bg-slate-50 font-black text-slate-900">
                    <tr>
                      <td className="px-3 py-3 text-center">합계</td>
                      <td className="px-3 py-3 text-right">{amount(sum(data.pickupLedger, (row) => row.amount))}</td>
                      <td className="px-3 py-3 text-center">순건수</td>
                      <td className="px-3 py-3 text-right">{categoryTotals.count}건</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <h3 className="border-b border-slate-200 px-4 py-3 text-center text-lg font-black text-slate-900">야구장 픽업 매출 유형별 정산</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-amber-100 text-slate-700">
                  <tr>{["날짜", "냉장건수", "냉장금액", "상온건수", "상온금액", "캐리어건수", "캐리어금액", "전체건수", "전체금액"].map((label) => <th key={label} className="px-3 py-2 text-right font-black first:text-center">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.pickupDaily.length ? data.pickupDaily.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-semibold text-slate-600">{row.date}</td>
                      {[row.coldCount, row.coldAmount, row.roomCount, row.roomAmount, row.carrierCount, row.carrierAmount, row.count, row.amount].map((value, index) => <td key={index} className="px-3 py-2 text-right font-semibold text-slate-700">{won.format(value)}</td>)}
                    </tr>
                  )) : <EmptyRow colSpan={9} />}
                </tbody>
                <tfoot className="border-t-2 border-slate-800 bg-slate-50 font-black text-slate-900">
                  <tr>
                    <td className="px-3 py-3 text-center">합계</td>
                    {[categoryTotals.coldCount, categoryTotals.coldAmount, categoryTotals.roomCount, categoryTotals.roomAmount, categoryTotals.carrierCount, categoryTotals.carrierAmount, categoryTotals.count, categoryTotals.amount].map((value, index) => <td key={index} className="px-3 py-3 text-right">{won.format(value)}</td>)}
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

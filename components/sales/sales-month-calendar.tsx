"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/common";
import type { MonthSalesApiItem, PointKey } from "@/lib/sales/types";

type Props = {
  year: number;
  month: number;
  point: PointKey;
  loading: boolean;
  rows: MonthSalesApiItem[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onChangePoint: (value: PointKey) => void;
  onRefresh: () => void;
};

const pointOptions: { label: string; value: PointKey }[] = [
  { label: "으능정이점", value: "sungsim" },
  { label: "야구장점", value: "baseball" },
  { label: "은행점", value: "bank" },
];

type CalendarCell = {
  key: string;
  date: Date;
  inMonth: boolean;
  dayNumber: number;
  totalAmount: number;
  appAmount: number;
  cardAmount: number;
  cashAmount: number;
  paymentCount: number;
  cancelCount: number;
  paymentAmount: number;
  cancelAmount: number;
  isToday: boolean;
};

function parseDate(value?: string | null) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const digits = String(value).replace(/[^\d]/g, "");
  if (digits.length >= 8) {
    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    return new Date(year, month - 1, day);
  }

  return null;
}

function getRecordValue(
  record: Record<string, number> | undefined,
  keys: string[]
) {
  return keys.reduce((acc, key) => acc + Number(record?.[key] ?? 0), 0);
}

function getDaySummary(row?: MonthSalesApiItem | null) {
  const appAmount = getRecordValue(row?.paymentTypeAmount, ["0", "additionalProp1"]);
  const cardAmount = getRecordValue(row?.paymentTypeAmount, ["1", "additionalProp2"]);
  const cashAmount = getRecordValue(row?.paymentTypeAmount, ["2", "additionalProp3"]);
  const appCancelAmount = getRecordValue(row?.paymentTypeCancelAmount, ["0", "additionalProp1"]);
  const cardCancelAmount = getRecordValue(row?.paymentTypeCancelAmount, ["1", "additionalProp2"]);
  const cashCancelAmount = getRecordValue(row?.paymentTypeCancelAmount, ["2", "additionalProp3"]);

  return {
    appAmount: appAmount - appCancelAmount,
    cardAmount: cardAmount - cardCancelAmount,
    cashAmount: cashAmount - cashCancelAmount,
    paymentCount: Math.round(
      getRecordValue(row?.paymentTypeCount as Record<string, number> | undefined, [
        "0",
        "1",
        "2",
        "additionalProp1",
        "additionalProp2",
        "additionalProp3",
      ])
    ),
    cancelCount: Math.round(
      getRecordValue(row?.paymentTypeCancelCount as Record<string, number> | undefined, [
        "0",
        "1",
        "2",
        "additionalProp1",
        "additionalProp2",
        "additionalProp3",
      ])
    ),
    paymentAmount: Number(
      row?.paymentAmount ??
        getRecordValue(row?.paymentTypeAmount, [
          "0",
          "1",
          "2",
          "additionalProp1",
          "additionalProp2",
          "additionalProp3",
        ])
    ),
    cancelAmount: Number(
      row?.cancelAmount ??
        getRecordValue(row?.paymentTypeCancelAmount, [
          "0",
          "1",
          "2",
          "additionalProp1",
          "additionalProp2",
          "additionalProp3",
        ])
    ),
  };
}

function formatCompactPrice(value: number) {
  return value.toLocaleString("ko-KR");
}

function toIsoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function SalesMonthCalendar({
  year,
  month,
  point,
  loading,
  rows,
  onPrevMonth,
  onNextMonth,
  onChangePoint,
  onRefresh,
}: Props) {
  const [selectedCell, setSelectedCell] = useState<CalendarCell | null>(null);
  const todayKey = useMemo(() => toIsoDate(new Date()), []);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const day = getDaySummary(row);
        acc.total += day.paymentAmount - day.cancelAmount;
        acc.app += day.appAmount;
        acc.card += day.cardAmount;
        acc.cash += day.cashAmount;
        return acc;
      },
      { total: 0, app: 0, card: 0, cash: 0 }
    );
  }, [rows]);

  const cells = useMemo(() => {
    const rowMap = new Map<string, MonthSalesApiItem>();

    rows.forEach((row) => {
      const parsed = parseDate(row.createdAt);
      if (!parsed) return;
      rowMap.set(toIsoDate(parsed), row);
    });

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const result: CalendarCell[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const iso = toIsoDate(cursor);
      const row = rowMap.get(iso) ?? null;
      const day = getDaySummary(row);

      result.push({
        key: iso,
        date: new Date(cursor),
        inMonth: cursor.getMonth() === month - 1,
        isToday: iso === todayKey,
        dayNumber: cursor.getDate(),
        totalAmount: day.paymentAmount - day.cancelAmount,
        appAmount: day.appAmount,
        cardAmount: day.cardAmount,
        cashAmount: day.cashAmount,
        paymentCount: day.paymentCount,
        cancelCount: day.cancelCount,
        paymentAmount: day.paymentAmount,
        cancelAmount: day.cancelAmount,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [month, rows, todayKey, year]);

  const title = `${year}년 ${month}월`;
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <>
      <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 2xl:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[28px] font-black tracking-[-0.04em] text-slate-800 sm:text-[40px] 2xl:text-[48px]">
                {title}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrevMonth}
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-400 transition hover:bg-slate-200"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={onNextMonth}
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-400 transition hover:bg-slate-200"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={point}
              onChange={(e) => onChangePoint(e.target.value as PointKey)}
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 outline-none"
            >
              {pointOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-b border-slate-200 pb-6 xl:grid-cols-4 2xl:gap-5 2xl:pb-8">
          <SummaryStat label={`${month}월 총금액`} value={summary.total} />
          <SummaryStat label="앱" value={summary.app} />
          <SummaryStat label="카드" value={summary.card} />
          <SummaryStat label="현금" value={summary.cash} />
        </div>

        <div className="mt-5">
          <div className="hidden grid-cols-7 gap-2 sm:grid 2xl:gap-3">
            {weekLabels.map((label, index) => (
              <div
                key={label}
                className={[
                  "px-1 py-1 text-center text-[14px] font-black 2xl:text-[16px]",
                  index === 0
                    ? "text-rose-400"
                    : index === 6
                    ? "text-rose-500"
                    : "text-slate-600",
                ].join(" ")}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-2 sm:hidden">
            {cells.map((cell) => (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedCell(cell)}
                className={[
                  "flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition",
                  cell.inMonth
                    ? cell.isToday
                      ? "border-rose-200 bg-rose-50/40 shadow-[0_10px_30px_rgba(251,113,133,0.08)]"
                      : "border-slate-100 bg-white"
                    : "border-slate-100 bg-slate-50/80 text-slate-300",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={[
                        "text-[20px] font-black",
                        cell.date.getDay() === 0
                          ? "text-rose-400"
                          : cell.date.getDay() === 6
                          ? "text-rose-500"
                          : "text-slate-700",
                        !cell.inMonth ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      {cell.dayNumber}
                    </div>
                    <div className="text-[12px] font-bold text-slate-400">
                      {weekLabels[cell.date.getDay()]}
                    </div>
                    {cell.isToday ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-500">
                        오늘
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-[132px]">
                  <AmountLine label="총금액" value={cell.totalAmount} tone="blue" compact />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-2 hidden grid-cols-2 gap-2 sm:grid xl:grid-cols-7 2xl:gap-3">
            {cells.map((cell) => (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedCell(cell)}
                className={[
                  "min-h-[124px] rounded-[22px] border px-3 py-2.5 text-left transition 2xl:min-h-[156px] 2xl:px-4 2xl:py-3.5",
                  cell.inMonth
                    ? cell.isToday
                      ? "border-rose-200 bg-rose-50/40 shadow-[0_10px_30px_rgba(251,113,133,0.08)] hover:-translate-y-0.5 hover:shadow-md"
                      : "border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-md"
                    : "border-slate-100 bg-slate-50/80 text-slate-300",
                ].join(" ")}
                >
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      "text-[15px] font-bold 2xl:text-[20px]",
                      cell.date.getDay() === 0
                        ? "text-rose-400"
                        : cell.date.getDay() === 6
                        ? "text-rose-500"
                        : "text-slate-600",
                      !cell.inMonth ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    {cell.dayNumber}
                  </div>

                  {cell.isToday ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-500 2xl:px-2.5 2xl:py-1 2xl:text-[12px]">
                      오늘
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-0.5 sm:hidden">
                  <AmountLine label="총금액" value={cell.totalAmount} tone="blue" compact />
                </div>

                <div className="mt-3 hidden space-y-0.5 sm:block 2xl:mt-4 2xl:space-y-1">
                  <AmountLine label="총금액" value={cell.totalAmount} tone="blue" />
                  <AmountLine label="앱" value={cell.appAmount} tone="green" />
                  <AmountLine label="카드" value={cell.cardAmount} tone="slate" />
                  <AmountLine label="현금" value={cell.cashAmount} tone="amber" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedCell ? (
        <SalesDayDetailModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      ) : null}
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-slate-200 xl:border-r xl:pr-6 xl:last:border-r-0 2xl:pr-8">
      <div className="text-[13px] font-black text-slate-400 sm:text-[14px] 2xl:text-[16px]">{label}</div>
      <div className="mt-2 text-[22px] font-black tracking-[-0.04em] text-slate-800 sm:text-[26px] 2xl:text-[32px]">
        {formatPrice(value)}
      </div>
    </div>
  );
}

function AmountLine({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: number;
  tone: "blue" | "green" | "slate" | "amber";
  compact?: boolean;
}) {
  const toneClass =
    tone === "blue"
      ? "text-blue-500"
      : tone === "green"
      ? "text-emerald-500"
      : tone === "amber"
      ? "text-amber-500"
      : "text-slate-400";

  return (
    <div
      className={[
        compact
          ? "grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-1 text-[12px] font-semibold leading-[1.15]"
          : "grid grid-cols-[40px_minmax(0,1fr)] items-baseline gap-2 text-[13px] font-semibold leading-[1.2] 2xl:grid-cols-[48px_minmax(0,1fr)] 2xl:gap-2.5 2xl:text-[16px]",
        toneClass,
      ].join(" ")}
    >
      <span
        className={`text-right font-black opacity-70 ${
          compact ? "text-[9px]" : "text-[10px] 2xl:text-[12px]"
        }`}
      >
        {label}
      </span>
      <span className="text-right">{formatCompactPrice(value)}</span>
    </div>
  );
}

function SalesDayDetailModal({
  cell,
  onClose,
}: {
  cell: CalendarCell;
  onClose: () => void;
}) {
  const rows = [
    { label: "결제건수", value: `${cell.paymentCount.toLocaleString()}` },
    { label: "취소건수", value: `${cell.cancelCount.toLocaleString()}` },
    { label: "결제액", value: formatPrice(cell.paymentAmount) },
    { label: "취소액", value: formatPrice(cell.cancelAmount) },
    { label: "매출액", value: formatPrice(cell.totalAmount) },
    { label: "앱", value: formatPrice(cell.appAmount) },
    { label: "카드", value: formatPrice(cell.cardAmount) },
    { label: "현금", value: formatPrice(cell.cashAmount) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.16)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[34px] font-black tracking-[-0.05em] text-slate-800 sm:text-[38px]">
              매출액
            </div>
            <div className="mt-2 text-sm font-bold text-slate-400 sm:text-base">
              {cell.date.getFullYear()}년 {cell.date.getMonth() + 1}월 {cell.dayNumber}일
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl text-4xl font-light text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
          >
            ×
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.1fr_1fr] border-b border-slate-200 last:border-b-0"
            >
              <div className="bg-slate-50 px-5 py-3.5 text-[16px] font-black text-slate-600 sm:text-[18px]">
                {row.label}
              </div>
              <div className="px-5 py-3.5 text-[18px] font-semibold text-slate-700 sm:text-[20px]">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

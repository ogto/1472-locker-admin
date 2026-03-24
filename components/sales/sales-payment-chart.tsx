"use client";

import { formatPrice } from "@/lib/common";
import type { PaymentChartRow } from "@/lib/sales/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  rows: PaymentChartRow[];
};

const COLORS = ["#0f172a", "#475569", "#94a3b8"];

export function SalesPaymentChart({ rows }: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">결제수단 비중</h2>
        <p className="mt-1 text-sm text-slate-500">월 기준 결제수단별 결제 금액 / 취소 금액</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="amount" nameKey="label" innerRadius={72} outerRadius={104}>
                {rows.map((entry, index) => (
                  <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const netAmount = row.amount - row.cancelAmount;

            return (
              <div key={row.key} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-black text-slate-900">{row.label}</p>
                  <p className="text-sm font-bold text-slate-500">
                    결제 {row.count.toLocaleString()}건
                  </p>
                </div>

                <p className="mt-2 text-xl font-black text-slate-900">
                  {formatPrice(row.amount)}
                </p>

                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-rose-500">
                    취소 {row.cancelCount.toLocaleString()}건 / {formatPrice(row.cancelAmount)}
                  </p>
                  <p className="font-bold text-slate-700">
                    매출 {formatPrice(netAmount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
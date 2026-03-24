"use client";

import { formatPrice } from "@/lib/common";
import type { MonthlyChartRow } from "@/lib/sales/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  rows: MonthlyChartRow[];
};

export function SalesMonthChart({ rows }: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">월별 매출 추이</h2>
        <p className="mt-1 text-sm text-slate-500">일자별 총매출 흐름</p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `${Number(value).toLocaleString()}`} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => formatPrice(Number(value))} />
            <Bar dataKey="totalAmount" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
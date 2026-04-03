"use client";

import { useEffect, useMemo, useState } from "react";
import type { ManualSalesRequest, PointKey } from "@/lib/sales/types";

type Props = {
  open: boolean;
  point: PointKey;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: ManualSalesRequest) => Promise<void>;
};

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function SalesManualModal({
  open,
  point,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [price, setPrice] = useState("");
  const [payType, setPayType] = useState<"1" | "2">("1");
  const [memo, setMemo] = useState("");
  const [localError, setLocalError] = useState("");
  const [submittingText, setSubmittingText] = useState("");

  useEffect(() => {
    if (!open) {
      setLocalError("");
      setSubmittingText("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  const disabled = useMemo(() => {
    return loading || !price.trim() || !memo.trim();
  }, [loading, price, memo]);

  if (!open) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async () => {
    setLocalError("");
    setSubmittingText("");

    const amount = toNumber(price);

    if (!amount || amount <= 0) {
      setLocalError("금액을 정확히 입력해줘.");
      return;
    }

    if (!memo.trim()) {
      setLocalError("메모를 입력해줘.");
      return;
    }

    try {
      setSubmittingText("등록 중...");
      await onSubmit({
        price: amount,
        payType: Number(payType) as 1 | 2,
        point,
        memo: memo.trim(),
      });

      setPrice("");
      setPayType("1");
      setMemo("");
      setSubmittingText("");
      onClose();
    } catch (err) {
      setSubmittingText("");
      setLocalError(
        err instanceof Error ? err.message : "수동 매출 등록에 실패했습니다.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/55 px-3 py-4 sm:px-4 sm:py-8"
      onClick={handleClose}
    >
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div
          className="w-full rounded-[28px] border border-white/60 bg-white p-4 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[28px] font-black tracking-[-0.03em] text-slate-900">
                수동 매출 추가
              </h2>
              <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-500">
                기본결제만 등록되며 결제수단은 카드 또는 현금만 가능합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="shrink-0 rounded-2xl border border-slate-200 px-4 py-3 text-[15px] font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              닫기
            </button>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <div className="text-[15px] font-black text-slate-800">금액</div>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-[22px] border border-slate-200 px-4 py-4 text-[18px] font-bold outline-none transition focus:border-slate-400"
                placeholder="예: 3000"
              />
            </label>

            <label className="block space-y-2">
              <div className="text-[15px] font-black text-slate-800">결제수단</div>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value as "1" | "2")}
                className="w-full rounded-[22px] border border-slate-200 px-4 py-4 text-[18px] font-bold outline-none transition focus:border-slate-400"
              >
                <option value="1">카드</option>
                <option value="2">현금</option>
              </select>
            </label>

            <label className="block space-y-2">
              <div className="text-[15px] font-black text-slate-800">메모</div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-[22px] border border-slate-200 px-4 py-4 text-[16px] font-medium outline-none transition focus:border-slate-400"
                placeholder="예: 딸기우유 / 환타 오렌지"
              />
            </label>
          </div>

          {localError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-bold text-rose-600">
              {localError}
            </div>
          ) : null}

          {submittingText ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-slate-600">
              {submittingText}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-[22px] border border-slate-200 px-4 py-4 text-[16px] font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              className={[
                "rounded-[22px] px-4 py-4 text-[16px] font-black text-white transition",
                disabled
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]",
              ].join(" ")}
            >
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Status = "error" | "loading" | "success";

function receiptUrl(payment: Record<string, unknown>) {
  const receipt =
    payment.receipt && typeof payment.receipt === "object"
      ? (payment.receipt as Record<string, unknown>)
      : null;

  return String(receipt?.url || "").trim();
}

export function PhotoCardPaymentSuccessClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("결제를 확인하고 있습니다.");
  const [receipt, setReceipt] = useState("");

  useEffect(() => {
    async function confirmPayment() {
      const paymentKey = searchParams.get("paymentKey") || "";
      const orderId = searchParams.get("orderId") || "";
      const amount = Number(searchParams.get("amount") || 0);

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setMessage("결제 승인 정보가 없습니다.");
        return;
      }

      try {
        const response = await fetch("/api/photo-card-payments/test/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          payment?: Record<string, unknown>;
        };

        if (!response.ok || !data.ok) {
          setStatus("error");
          setMessage(data.message || "결제 승인에 실패했습니다.");
          return;
        }

        setStatus("success");
        setMessage("결제가 완료되었습니다. 키오스크 화면으로 돌아가 주세요.");
        setReceipt(receiptUrl(data.payment || {}));
      } catch {
        setStatus("error");
        setMessage("결제 승인 중 오류가 발생했습니다.");
      }
    }

    void confirmPayment();
  }, [searchParams]);

  return (
    <main className="min-h-svh bg-[#f8f6f1] px-4 py-6 text-[#231812]">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-[520px] flex-col justify-center">
        <div className="rounded-lg border border-[#e2d8cc] bg-white p-6 text-center">
          <p className="text-sm font-bold text-[#8a7667]">PHOTO CARD PAYMENT</p>
          <h1 className="mt-2 text-2xl font-black">
            {status === "loading"
              ? "결제 확인 중"
              : status === "success"
                ? "결제 완료"
                : "결제 확인 실패"}
          </h1>
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm font-bold ${
              status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : status === "loading"
                  ? "bg-[#f2ede6] text-[#7b6b5e]"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {receipt ? (
              <a className="rounded-lg bg-[#241912] px-4 py-3 font-black text-white" href={receipt}>
                영수증 보기
              </a>
            ) : null}
            <Link className="rounded-lg border border-[#d8cabd] px-4 py-3 font-black" href="/pay/photo-card">
              결제 화면으로
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatWon } from "@/lib/photo-card-payments/config";
import type {
  PhotoCardPaymentOrder,
  TossWidgets,
} from "@/lib/photo-card-payments/types";

type Props = {
  clientKey: string;
  initialOrder: PhotoCardPaymentOrder;
};

function loadTossPaymentsSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.TossPayments) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-toss-payments-sdk]",
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.dataset.tossPaymentsSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

export function PhotoCardPaymentClient({ clientKey, initialOrder }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const widgetsRef = useRef<TossWidgets | null>(null);

  useEffect(() => {
    let canceled = false;

    async function createAndRefreshOrder() {
      if (!initialOrder.orderId) {
        return;
      }

      try {
        const response = await fetch("/api/photo-card-payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(initialOrder),
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          order?: PhotoCardPaymentOrder;
        };

        if (!canceled && response.ok && data.ok && data.order) {
          setOrder(data.order);
        }
      } catch {
        // Query string order data is enough for local Toss test payments.
      }
    }

    void createAndRefreshOrder();

    return () => {
      canceled = true;
    };
  }, [initialOrder.orderId]);

  useEffect(() => {
    let canceled = false;

    async function renderWidget() {
      setReady(false);
      setError("");

      if (!clientKey) {
        setError("Toss 테스트 클라이언트 키가 없습니다.");
        return;
      }

      if (!order.orderId || order.amount <= 0) {
        setError("결제 정보가 올바르지 않습니다.");
        return;
      }

      try {
        document.querySelector("#photo-card-payment-methods")?.replaceChildren();
        document.querySelector("#photo-card-payment-agreement")?.replaceChildren();

        await loadTossPaymentsSdk();

        if (canceled) {
          return;
        }

        const tossPayments = window.TossPayments?.(clientKey);
        const widgets = tossPayments?.widgets({ customerKey: order.customerKey });

        if (!widgets) {
          throw new Error("토스 결제 위젯을 초기화하지 못했습니다.");
        }

        await widgets.setAmount({ currency: "KRW", value: order.amount });
        await widgets.renderPaymentMethods({ selector: "#photo-card-payment-methods" });
        await widgets.renderAgreement({ selector: "#photo-card-payment-agreement" });

        if (!canceled) {
          widgetsRef.current = widgets;
          setReady(true);
        }
      } catch (widgetError) {
        if (!canceled) {
          setError(
            widgetError instanceof Error
              ? widgetError.message
              : "결제 위젯을 불러오지 못했습니다.",
          );
        }
      }
    }

    void renderWidget();

    return () => {
      canceled = true;
    };
  }, [clientKey, order.amount, order.customerKey, order.orderId]);

  async function requestPayment() {
    setMessage("");
    setError("");

    if (order.status === "PAID") {
      setMessage("이미 결제 완료된 주문입니다.");
      return;
    }

    if (!widgetsRef.current || !ready) {
      setError("결제수단을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    setLoading(true);

    try {
      await widgetsRef.current.setAmount({ currency: "KRW", value: order.amount });

      const origin = window.location.origin;
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${origin}/pay/photo-card/success`,
        failUrl: `${origin}/pay/photo-card/fail`,
      });
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "결제 요청 중 오류가 발생했습니다.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#f8f6f1] px-4 py-5 text-[#231812]">
      <section className="mx-auto flex min-h-[calc(100svh-40px)] w-full max-w-[520px] flex-col">
        <div className="mb-5">
          <p className="text-sm font-bold text-[#8a7667]">PHOTO CARD PAYMENT</p>
          <h1 className="mt-1 text-2xl font-black">포토카드 결제</h1>
        </div>

        <div className="mb-4 rounded-lg border border-[#e2d8cc] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#8a7667]">상품명</p>
              <h2 className="mt-1 text-lg font-black">{order.orderName}</h2>
            </div>
            <CreditCard className="mt-1 h-6 w-6 text-[#241912]" aria-hidden="true" />
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-[#eee7dd] pt-4">
            <span className="text-sm font-bold text-[#8a7667]">결제 금액</span>
            <strong className="text-3xl font-black">{formatWon(order.amount)}</strong>
          </div>
          <p className="mt-3 break-all text-xs font-semibold text-[#9b8d82]">
            {order.orderId}
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-[#e2d8cc] bg-white p-2">
          <div id="photo-card-payment-methods" />
        </div>

        <div className="mb-4 rounded-lg border border-[#e2d8cc] bg-white p-2">
          <div id="photo-card-payment-agreement" />
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="mt-auto pb-[env(safe-area-inset-bottom)]">
          <button
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-lg bg-[#241912] px-5 text-lg font-black text-white disabled:opacity-45"
            disabled={loading || !ready}
            onClick={() => void requestPayment()}
            type="button"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
            {loading ? "결제창 여는 중" : `${formatWon(order.amount)} 결제하기`}
          </button>
        </div>
      </section>
    </main>
  );
}

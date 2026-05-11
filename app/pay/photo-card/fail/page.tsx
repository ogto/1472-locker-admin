import Link from "next/link";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PhotoCardPaymentFailPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const message =
    firstParam(resolvedSearchParams.message)?.trim() || "결제가 완료되지 않았습니다.";
  const orderId = firstParam(resolvedSearchParams.orderId)?.trim();
  const retryHref = orderId
    ? `/pay/photo-card?orderId=${encodeURIComponent(orderId)}`
    : "/pay/photo-card";

  return (
    <main className="min-h-svh bg-[#f8f6f1] px-4 py-6 text-[#231812]">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-[520px] flex-col justify-center">
        <div className="rounded-lg border border-[#e2d8cc] bg-white p-6 text-center">
          <p className="text-sm font-bold text-[#8a7667]">PHOTO CARD PAYMENT</p>
          <h1 className="mt-2 text-2xl font-black">결제 실패</h1>
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </div>
          <Link
            className="mt-5 block rounded-lg bg-[#241912] px-4 py-3 font-black text-white"
            href={retryHref}
          >
            다시 결제하기
          </Link>
        </div>
      </section>
    </main>
  );
}

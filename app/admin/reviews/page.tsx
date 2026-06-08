"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, RefreshCw, Search, X, XCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { LoginCard } from "@/components/auth/login-card";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  approveReviewEvent,
  fetchReviewEvents,
  markReviewEventsPaid,
  rejectReviewEvent,
} from "@/lib/reviews/api";
import type { ReviewEvent, ReviewEventStatus } from "@/lib/reviews/types";

const statusOptions: Array<{ value: ReviewEventStatus | ""; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "REVIEW_PENDING", label: "검수대기" },
  { value: "PAYMENT_PENDING", label: "지급대기" },
  { value: "APPROVED", label: "승인완료" },
  { value: "PAID", label: "지급완료" },
  { value: "REJECTED", label: "반려" },
  { value: "PROOF_SENT", label: "영수증발급" },
  { value: "REQUESTED", label: "접수" },
];

const statusLabels: Record<ReviewEventStatus, string> = {
  REQUESTED: "접수",
  PROOF_SENT: "영수증발급",
  REVIEW_PENDING: "검수대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
  REWARDED: "보상완료",
  PAYMENT_PENDING: "지급대기",
  PAID: "지급완료",
  DUPLICATED: "중복",
};

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function maskPhone(phone: string) {
  return phone || "-";
}

function statusClass(status: ReviewEventStatus) {
  if (status === "REVIEW_PENDING") return "bg-amber-100 text-amber-800";
  if (status === "PAYMENT_PENDING") return "bg-sky-100 text-sky-800";
  if (status === "PAID" || status === "APPROVED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED" || status === "DUPLICATED") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

export default function AdminReviewsPage() {
  const auth = useAdminAuth();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ReviewEventStatus | "">("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<ReviewEvent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [okText, setOkText] = useState("");
  const [reason, setReason] = useState("");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    title: string;
    src: string;
  } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) || rows[0] || null,
    [rows, selectedId]
  );
  const selectedPaymentIdSet = useMemo(() => new Set(selectedPaymentIds), [selectedPaymentIds]);

  async function load(nextStatus = status, nextPhone = phone) {
    setLoading(true);
    setErrorText("");
    setOkText("");

    try {
      const items = await fetchReviewEvents({ status: nextStatus, phone: nextPhone });
      setRows(items);
      setSelectedPaymentIds((current) => {
        const payableIds = new Set(
          items.filter((item) => item.status === "PAYMENT_PENDING").map((item) => item.id)
        );
        return current.filter((id) => payableIds.has(id));
      });
      setSelectedId((current) => {
        if (current && items.some((item) => item.id === current)) return current;
        return items[0]?.id ?? null;
      });
    } catch (error) {
      setRows([]);
      setSelectedId(null);
      setErrorText(error instanceof Error ? error.message : "리뷰 이벤트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    setActionLoading(true);
    setErrorText("");
    setOkText("");

    try {
      await action();
      setOkText(message);
      setReason("");
      await load();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  function confirmApprove(event: ReviewEvent) {
    const reward =
      event.rewardType === "CASH"
        ? `현금 ${formatWon(event.rewardAmount)}`
        : event.couponId
          ? `쿠폰 #${event.couponId}`
          : "선택된 혜택";
    return window.confirm(`신청 #${event.id}을 승인 처리할까요?\n\n혜택: ${reward}`);
  }

  function confirmReject(event: ReviewEvent, rejectReason: string) {
    const reasonText = rejectReason.trim();
    const message = reasonText
      ? `신청 #${event.id}을 반려 처리할까요?\n\n처리 사유: ${reasonText}`
      : `신청 #${event.id}을 반려 처리할까요?\n\n처리 사유가 비어 있습니다. 기본 반려 사유로 처리됩니다.`;
    return window.confirm(message);
  }

  function confirmMarkPaid(events: ReviewEvent[]) {
    const count = events.length;
    const total = events.reduce((sum, event) => sum + Number(event.rewardAmount || 0), 0);
    return window.confirm(
      `${count.toLocaleString("ko-KR")}건을 지급완료 처리할까요?\n\n총 지급액: ${formatWon(total)}`
    );
  }

  function togglePaymentSelection(id: number, checked: boolean) {
    setSelectedPaymentIds((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((item) => item !== id);
    });
  }

  function markPaidByIds(ids: number[]) {
    const targets = rows.filter((row) => ids.includes(row.id) && row.status === "PAYMENT_PENDING");
    if (targets.length === 0) {
      setErrorText("지급완료 처리할 지급대기 건을 선택해주세요.");
      return;
    }
    if (!confirmMarkPaid(targets)) return;
    void runAction(
      () => markReviewEventsPaid(targets.map((event) => event.id)),
      `${targets.length.toLocaleString("ko-KR")}건 지급완료 처리했습니다.`
    );
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !auth.booting && auth.authenticated) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, auth.booting, auth.authenticated]);

  if (!mounted || auth.booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_35%,#f8fbff_100%)] px-4">
        <div className="rounded-full bg-white px-6 py-3 text-lg font-black text-slate-800 shadow">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <LoginCard
        password={auth.password}
        error={auth.loginError}
        loading={auth.loginLoading}
        onChangePassword={auth.setPassword}
        onSubmit={auth.handleLogin}
      />
    );
  }

  return (
    <AdminShell role={auth.role} onLogout={auth.handleLogout}>
      <AdminHeader
        title="리뷰관리"
        description="카카오 리뷰 이벤트 접수, 증빙 검수, 현금 지급 처리를 관리합니다."
        onLogout={auth.handleLogout}
      />

      <div className="space-y-4 lg:space-y-6">
        <section className="rounded-[24px] border border-white/70 bg-white/75 p-3 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-5">
          <div className="grid gap-2 sm:gap-3 lg:grid-cols-[180px_minmax(180px,1fr)_auto_auto]">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ReviewEventStatus | "")}
              className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-pink-300 sm:min-h-[46px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void load();
                }}
                placeholder="전화번호 검색"
                className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-pink-300 sm:min-h-[46px]"
              />
            </div>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[46px]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              조회
            </button>

            <a
              href="/api/reviews/payments/excel"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 sm:min-h-[46px]"
            >
              <Download className="h-4 w-4" />
              지급 엑셀
            </a>
          </div>
        </section>

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}
        {okText ? <StatusBanner type="ok" text={okText} /> : null}
        {selectedPaymentIds.length > 0 ? (
          <section className="flex flex-col gap-2 rounded-[24px] border border-sky-100 bg-sky-50/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-4">
            <div className="text-sm font-black text-sky-900">
              지급대기 {selectedPaymentIds.length.toLocaleString("ko-KR")}건 선택됨
            </div>
            <button
              type="button"
              onClick={() => markPaidByIds(selectedPaymentIds)}
              disabled={actionLoading || loading}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              선택 지급완료
            </button>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.75fr)]">
          <section className="overflow-hidden rounded-[24px] border border-white/70 bg-white/75 shadow-sm backdrop-blur sm:rounded-[28px]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">
                신청 목록 {loading ? "" : `${rows.length.toLocaleString("ko-KR")}건`}
              </div>
            </div>

            <div className="space-y-2 p-3 lg:hidden">
              {rows.map((row) => {
                const active = selected?.id === row.id;

                return (
                  <div
                    key={row.id}
                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                      active
                        ? "border-pink-200 bg-pink-50"
                        : "border-slate-100 bg-white hover:border-pink-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(row.id);
                          setMobileDetailOpen(true);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-slate-900">
                            신청 #{row.id}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            {formatDate(row.createdAt)} · 예약 {row.reserveId}
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>
                          {statusLabels[row.status] || row.status}
                        </span>
                        {row.status === "PAYMENT_PENDING" ? (
                          <label className="inline-flex items-center gap-2 text-xs font-black text-sky-700">
                            <input
                              type="checkbox"
                              checked={selectedPaymentIdSet.has(row.id)}
                              onChange={(event) => togglePaymentSelection(row.id, event.target.checked)}
                              className="h-4 w-4 accent-sky-600"
                            />
                            선택
                          </label>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-400">전화번호</div>
                        <div className="mt-0.5 font-black text-slate-900">{maskPhone(row.phone)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400">이용금액</div>
                        <div className="mt-0.5 font-black text-slate-900">{formatWon(row.useAmount)}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-sm font-bold text-slate-600">
                      {row.rewardType === "CASH"
                        ? `현금 ${formatWon(row.rewardAmount)}`
                        : row.couponId
                          ? `쿠폰 #${row.couponId}`
                          : "혜택 없음"}
                    </div>
                    {row.status === "PAYMENT_PENDING" ? (
                      <button
                        type="button"
                        onClick={() => markPaidByIds([row.id])}
                        disabled={actionLoading || loading}
                        className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        지급완료
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">선택</th>
                    <th className="px-4 py-3">신청일</th>
                    <th className="px-4 py-3">전화번호</th>
                    <th className="px-4 py-3">예약번호</th>
                    <th className="px-4 py-3">금액</th>
                    <th className="px-4 py-3">혜택</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">중복</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const active = selected?.id === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={`cursor-pointer transition ${active ? "bg-pink-50/80" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-4 py-3">
                          {row.status === "PAYMENT_PENDING" ? (
                            <input
                              type="checkbox"
                              checked={selectedPaymentIdSet.has(row.id)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => togglePaymentSelection(row.id, event.target.checked)}
                              className="h-4 w-4 accent-sky-600"
                              aria-label={`신청 #${row.id} 지급완료 선택`}
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-3 font-black text-slate-900">{maskPhone(row.phone)}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{row.reserveId}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{formatWon(row.useAmount)}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.rewardType === "CASH"
                            ? `현금 ${formatWon(row.rewardAmount)}`
                            : row.couponId
                              ? `쿠폰 #${row.couponId}`
                              : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>
                            {statusLabels[row.status] || row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-rose-500">
                          {row.duplicateFlags?.length ? row.duplicateFlags.join(", ") : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && rows.length === 0 ? (
              <div className="px-5 py-12 text-center sm:py-16">
                <div className="text-lg font-black text-slate-900">조회된 리뷰 이벤트가 없습니다</div>
                <div className="mt-2 text-sm font-bold text-slate-500">
                  상태나 전화번호 조건을 바꿔 다시 조회해 주세요.
                </div>
              </div>
            ) : null}
          </section>

          <div className="hidden lg:block">
            <ReviewDetail
              event={selected}
              reason={reason}
              disabled={actionLoading || loading}
              onChangeReason={setReason}
              onApprove={(event) => {
                if (confirmApprove(event)) {
                  void runAction(() => approveReviewEvent(event.id), "승인 처리했습니다.");
                }
              }}
              onReject={(event) => {
                if (confirmReject(event, reason)) {
                  void runAction(() => rejectReviewEvent(event.id, reason), "반려 처리했습니다.");
                }
              }}
              onMarkPaid={(event) => markPaidByIds([event.id])}
              onPreview={(title, src) => setPreviewImage({ title, src })}
            />
          </div>
        </div>
      </div>

      {mobileDetailOpen && selected ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-[radial-gradient(circle_at_top,#fff7fb_0%,#ffffff_42%,#f8fbff_100%)] p-3 shadow-2xl">
            <div className="sticky top-0 z-10 mb-2 flex justify-end bg-transparent">
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReviewDetail
              event={selected}
              reason={reason}
              disabled={actionLoading || loading}
              onChangeReason={setReason}
              onApprove={(event) => {
                if (confirmApprove(event)) {
                  void runAction(() => approveReviewEvent(event.id), "승인 처리했습니다.");
                }
              }}
              onReject={(event) => {
                if (confirmReject(event, reason)) {
                  void runAction(() => rejectReviewEvent(event.id, reason), "반려 처리했습니다.");
                }
              }}
              onMarkPaid={(event) => markPaidByIds([event.id])}
              onPreview={(title, src) => setPreviewImage({ title, src })}
            />
          </div>
        </div>
      ) : null}

      {previewImage ? (
        <ImagePreview
          title={previewImage.title}
          src={previewImage.src}
          onClose={() => setPreviewImage(null)}
        />
      ) : null}
    </AdminShell>
  );
}

function ReviewDetail({
  event,
  reason,
  disabled,
  onChangeReason,
  onApprove,
  onReject,
  onMarkPaid,
  onPreview,
}: {
  event: ReviewEvent | null;
  reason: string;
  disabled: boolean;
  onChangeReason: (value: string) => void;
  onApprove: (event: ReviewEvent) => void;
  onReject: (event: ReviewEvent) => void;
  onMarkPaid: (event: ReviewEvent) => void;
  onPreview: (title: string, src: string) => void;
}) {
  if (!event) {
    return (
      <aside className="rounded-[24px] border border-white/70 bg-white/75 p-5 text-center shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
        <div className="text-lg font-black text-slate-900">신청 건을 선택하세요</div>
        <div className="mt-2 text-sm font-bold text-slate-500">
          왼쪽 목록에서 검수할 리뷰 이벤트를 선택하면 상세 정보가 표시됩니다.
        </div>
      </aside>
    );
  }

  const canApprove = event.status === "REVIEW_PENDING";
  const canMarkPaid = event.status === "PAYMENT_PENDING";
  return (
    <aside className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">신청 #{event.id}</div>
          <div className="mt-1 text-sm font-bold text-slate-500">
            reserveId {event.reserveId} · {formatDate(event.createdAt)}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusClass(event.status)}`}>
          {statusLabels[event.status] || event.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Info label="전화번호" value={maskPhone(event.phone)} />
        <Info label="지점" value={event.point || "-"} />
        <Info label="이용금액" value={formatWon(event.useAmount)} />
        <Info
          label="혜택"
          value={
            event.rewardType === "CASH"
              ? `현금 ${formatWon(event.rewardAmount)}`
              : event.couponId
                ? `쿠폰 #${event.couponId}`
                : "-"
          }
        />
        <Info label="계좌" value={formatAccount(event)} wide />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <ImageBox
          title="전자영수증"
          src={event.proofImageUrl}
          onOpen={(src) => onPreview("전자영수증", src)}
        />
        <ImageBox
          title="리뷰 완료 캡처"
          src={event.screenshotUrl}
          onOpen={(src) => onPreview("리뷰 완료 캡처", src)}
        />
      </div>

      <div className="mt-4">
        <div className="text-sm font-black text-slate-900">처리 사유</div>
        <textarea
          value={reason}
          onChange={(event) => onChangeReason(event.target.value)}
          placeholder="반려 또는 중복 처리 사유"
          className="mt-2 min-h-[88px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-pink-300"
        />
      </div>

      {event.rejectReason ? (
        <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
          {event.rejectReason}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onApprove(event)}
          disabled={disabled || !canApprove}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          승인
        </button>
        <button
          type="button"
          onClick={() => onReject(event)}
          disabled={disabled}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-extrabold text-rose-700 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          반려
        </button>
      </div>
      {canMarkPaid ? (
        <button
          type="button"
          onClick={() => onMarkPaid(event)}
          disabled={disabled}
          className="mt-2 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          지급완료
        </button>
      ) : null}

      {event.duplicateFlags?.length ? (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          중복 의심: {event.duplicateFlags.join(", ")}
        </div>
      ) : null}
    </aside>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 ${wide ? "col-span-2" : ""}`}>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function ImageBox({
  title,
  src,
  onOpen,
}: {
  title: string;
  src?: string | null;
  onOpen: (src: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-black text-slate-900">{title}</div>
      <div className="mt-2 grid min-h-[180px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {src ? (
          <button
            type="button"
            onClick={() => onOpen(src)}
            className="grid h-full min-h-[180px] w-full place-items-center p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
            aria-label={`${title} 크게 보기`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={title}
              className="max-h-[360px] w-full object-contain"
            />
          </button>
        ) : (
          <span className="text-sm font-bold text-slate-400">이미지 없음</span>
        )}
      </div>
    </div>
  );
}

function ImagePreview({
  title,
  src,
  onClose,
}: {
  title: string;
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-0"
      onClick={onClose}
    >
      <div className="absolute left-4 top-4 right-4 z-10 flex items-center justify-between gap-3 text-white">
        <div className="min-w-0 truncate text-sm font-black sm:text-base">
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          aria-label="이미지 닫기"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        className="h-dvh w-screen object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

function formatAccount(event: ReviewEvent) {
  const parts = [event.bankName, event.accountNumber, event.accountHolder].filter(Boolean);
  return parts.length ? parts.join(" / ") : "-";
}

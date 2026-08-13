"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Download,
  Pencil,
  RefreshCw,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { LoginCard } from "@/components/auth/login-card";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  approveReviewEvent,
  cancelRejectReviewEvent,
  fetchReviewEvent,
  fetchReviewEvents,
  manualApproveReviewEvent,
  markReviewEventsPaid,
  rejectReviewEvent,
  updateReviewEventAccount,
} from "@/lib/reviews/api";
import type {
  ReviewEvent,
  ReviewEventAccountInput,
  ReviewEventManualApproveInput,
  ReviewEventProcessingHistory,
  ReviewEventRewardType,
  ReviewEventStatus,
} from "@/lib/reviews/types";

const statusOptions: Array<{ value: ReviewEventStatus | ""; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "REVIEW_PENDING", label: "검수대기" },
  { value: "PAYMENT_PENDING", label: "지급대기" },
  { value: "APPROVED", label: "계좌입력대기" },
  { value: "PAID", label: "지급완료" },
  { value: "REJECTED", label: "반려" },
  { value: "PROOF_SENT", label: "영수증발급" },
  { value: "REQUESTED", label: "접수" },
];

const statusLabels: Record<ReviewEventStatus, string> = {
  REQUESTED: "접수",
  PROOF_SENT: "영수증발급",
  REVIEW_PENDING: "검수대기",
  APPROVED: "계좌입력대기",
  REJECTED: "반려",
  REWARDED: "보상완료",
  PAYMENT_PENDING: "지급대기",
  PAID: "지급완료",
  DUPLICATED: "중복",
};

const PAGE_SIZE = 10;

const processingActionLabels: Record<string, string> = {
  "review_event.approved": "승인",
  "review_event.manual_approved": "수동 승인",
  "review_event.rejected": "반려",
  "review_event.reject_cancelled": "반려 취소",
  "review_event.restarted": "재신청",
  "review_event.duplicated": "중복 처리",
  "review_event.account_updated": "계좌정보 수정",
};

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
}

function maskPhone(phone: string) {
  return phone || "-";
}

function statusClass(status: ReviewEventStatus) {
  if (status === "REVIEW_PENDING") return "bg-amber-100 text-amber-800";
  if (status === "APPROVED") return "bg-amber-100 text-amber-800";
  if (status === "PAYMENT_PENDING") return "bg-sky-100 text-sky-800";
  if (status === "PAID") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED" || status === "DUPLICATED") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function visitRouteLabel(value?: string | null) {
  return value?.trim() || "미응답";
}

function hasCompleteReviewAccount(event: ReviewEvent) {
  return Boolean(
    event.bankName?.trim() && event.accountNumber?.trim() && event.accountHolder?.trim()
  );
}

function findDetailTargetAfterRefresh(
  previousRows: ReviewEvent[],
  refreshedRows: ReviewEvent[],
  currentId: number
) {
  const refreshedIds = new Set(refreshedRows.map((row) => row.id));

  const currentIndex = previousRows.findIndex((row) => row.id === currentId);
  if (currentIndex >= 0) {
    for (let index = currentIndex + 1; index < previousRows.length; index += 1) {
      const candidateId = previousRows[index].id;
      if (refreshedIds.has(candidateId)) return candidateId;
    }
  }

  return null;
}

export default function AdminReviewsPage() {
  const auth = useAdminAuth();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ReviewEventStatus | "">("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReviewEvent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [okText, setOkText] = useState("");
  const [reason, setReason] = useState("");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [copyToast, setCopyToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [detailEvent, setDetailEvent] = useState<ReviewEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const actionInFlightRef = useRef(false);
  const activeDetailIdRef = useRef<number | null>(null);
  const detailRequestRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    title: string;
    src: string;
  } | null>(null);

  const filteredRows = rows;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );
  const selected = useMemo(
    () => filteredRows.find((row) => row.id === selectedId) || filteredRows[0] || null,
    [filteredRows, selectedId]
  );
  const modalSummary = detailTargetId
    ? filteredRows.find((row) => row.id === detailTargetId) || null
    : null;
  const modalEvent = detailEvent?.id === detailTargetId ? detailEvent : modalSummary;
  const selectedPaymentIdSet = useMemo(() => new Set(selectedPaymentIds), [selectedPaymentIds]);
  const stats = useMemo(() => {
    const visitRouteCounts = filteredRows.reduce<Record<string, number>>((acc, row) => {
      const label = visitRouteLabel(row.visitRoute);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return {
      total: filteredRows.length,
      visitRouteItems: Object.entries(visitRouteCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [filteredRows]);

  async function load(nextStatus = status, nextPhone = phone) {
    setLoading(true);
    setErrorText("");
    setOkText("");

    try {
      const items = await fetchReviewEvents({ status: nextStatus, phone: nextPhone });
      setRows(items);
      setPage(1);
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
      return items;
    } catch (error) {
      setRows([]);
      setSelectedId(null);
      setErrorText(error instanceof Error ? error.message : "리뷰 이벤트를 불러오지 못했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);

    try {
      const event = await fetchReviewEvent(id);
      if (requestId !== detailRequestRef.current || activeDetailIdRef.current !== id) return false;
      setDetailEvent(event);
      return true;
    } catch (error) {
      if (requestId !== detailRequestRef.current || activeDetailIdRef.current !== id) return false;
      const message = error instanceof Error ? error.message : "상세 정보를 불러오지 못했습니다.";
      setDetailEvent(null);
      setErrorText(message);
      setCopyToast({ type: "error", text: message });
      return false;
    } finally {
      if (requestId === detailRequestRef.current && activeDetailIdRef.current === id) {
        setDetailLoading(false);
      }
    }
  }

  function openDetail(id: number) {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    activeDetailIdRef.current = id;
    setSelectedId(id);
    setDetailTargetId(id);
    setReason("");
    setDetailEvent(null);
    setDetailOpen(true);
    void loadDetail(id);
  }

  const closeDetail = useCallback(() => {
    activeDetailIdRef.current = null;
    detailRequestRef.current += 1;
    setDetailOpen(false);
    setDetailTargetId(null);
    setDetailEvent(null);
    setDetailLoading(false);
    setReason("");
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  async function runAction(
    action: () => Promise<unknown>,
    message: string,
    options: {
      clearReason?: boolean;
      detailBehavior?: "advance" | "refresh-current";
      eventId?: number;
    } = {}
  ) {
    if (actionInFlightRef.current) return false;
    actionInFlightRef.current = true;
    const rowsBeforeAction = rows;
    setActionLoading(true);
    setErrorText("");
    setOkText("");

    try {
      await action();
      setOkText(message);
      setCopyToast({ type: "ok", text: message });
      if (options.clearReason) setReason("");
      const refreshedRows = await load();
      if (!refreshedRows) {
        if (options.eventId && activeDetailIdRef.current === options.eventId) {
          if (options.detailBehavior === "advance") {
            closeDetail();
          } else if (options.detailBehavior === "refresh-current") {
            await loadDetail(options.eventId);
          }
        }
        return false;
      }

      if (options.eventId && activeDetailIdRef.current === options.eventId) {
        if (options.detailBehavior === "refresh-current") {
          return await loadDetail(options.eventId);
        }

        if (options.detailBehavior !== "advance") return true;

        const nextDetailId = findDetailTargetAfterRefresh(
          rowsBeforeAction,
          refreshedRows,
          options.eventId
        );

        if (!nextDetailId) {
          closeDetail();
          return true;
        }

        const nextIndex = refreshedRows.findIndex((row) => row.id === nextDetailId);
        if (nextIndex >= 0) setPage(Math.floor(nextIndex / PAGE_SIZE) + 1);

        if (nextDetailId !== options.eventId) {
          activeDetailIdRef.current = nextDetailId;
          detailRequestRef.current += 1;
          setSelectedId(nextDetailId);
          setDetailTargetId(nextDetailId);
          setDetailEvent(null);
          setReason("");
          window.requestAnimationFrame(() => {
            detailScrollRef.current?.scrollTo({ top: 0 });
            closeButtonRef.current?.focus();
          });
        }

        return await loadDetail(nextDetailId);
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.";
      setErrorText(errorMessage);
      setCopyToast({ type: "error", text: errorMessage });
      return false;
    } finally {
      actionInFlightRef.current = false;
      setActionLoading(false);
    }
  }

  function confirmApprove(event: ReviewEvent) {
    const effectiveRewardType = event.rewardType || "CASH";
    const reward =
      effectiveRewardType === "CASH"
        ? event.rewardType
          ? `현금 ${formatWon(event.rewardAmount)}`
          : "현금 지급 (기본)"
        : event.couponId
          ? `쿠폰 #${event.couponId}`
          : "선택된 혜택";
    const accountNotice = effectiveRewardType === "CASH" && !hasCompleteReviewAccount(event)
      ? "\n\n계좌정보가 없어 계좌입력대기로 승인됩니다."
      : "";
    return window.confirm(
      `신청 #${event.id}을 승인 처리할까요?\n\n혜택: ${reward}${accountNotice}`
    );
  }

  function confirmManualApprove(event: ReviewEvent, input: ReviewEventManualApproveInput) {
    const reward = input.rewardType === "CASH"
      ? hasCompleteReviewAccount(event)
        ? "현금 지급 (지급대기로 전환)"
        : "현금 지급 (계좌입력대기로 승인)"
      : `할인쿠폰 (승인 즉시 발급)`;
    return window.confirm(
      `신청 #${event.id}을 수동 승인할까요?\n\n혜택: ${reward}\n처리 사유: ${input.reason}`
    );
  }

  function confirmReject(event: ReviewEvent, rejectReason: string) {
    const reasonText = rejectReason.trim();
    const message = reasonText
      ? `신청 #${event.id}을 반려 처리할까요?\n\n처리 사유: ${reasonText}`
      : `신청 #${event.id}을 반려 처리할까요?\n\n처리 사유가 비어 있습니다. 기본 반려 사유로 처리됩니다.`;
    return window.confirm(message);
  }

  function confirmCancelReject(event: ReviewEvent) {
    return window.confirm(
      `신청 #${event.id}의 반려를 취소할까요?\n\n상태가 검수대기로 돌아갑니다.`
    );
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
      `${targets.length.toLocaleString("ko-KR")}건 지급완료 처리했습니다.`,
      {
        detailBehavior: targets.length === 1 ? "advance" : undefined,
        eventId: targets.length === 1 ? targets[0].id : undefined,
      }
    );
  }

  async function copyAccount(account: string) {
    if (!account || account === "-") {
      setErrorText("복사할 계좌정보가 없습니다.");
      setOkText("");
      setCopyToast({ type: "error", text: "복사할 계좌정보가 없습니다." });
      return;
    }

    try {
      await navigator.clipboard.writeText(account);
      setErrorText("");
      setOkText("계좌정보를 복사했습니다.");
      setCopyToast({ type: "ok", text: "계좌정보를 복사했어요." });
    } catch {
      setErrorText("계좌정보를 복사하지 못했습니다. 직접 드래그해서 복사해주세요.");
      setOkText("");
      setCopyToast({ type: "error", text: "복사하지 못했어요. 직접 복사해주세요." });
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !auth.booting && auth.authenticated) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, auth.booting, auth.authenticated]);

  useEffect(() => {
    if (!copyToast) return;
    const timer = window.setTimeout(() => setCopyToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copyToast]);

  useEffect(() => {
    if (!detailOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDetail();
        return;
      }
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        const focusable = dialog
          ? Array.from(
              dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
              )
            )
          : [];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDetail, detailOpen]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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

            <Link
              href="/api/reviews/payments/excel"
              prefetch={false}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 sm:min-h-[46px]"
            >
              <Download className="h-4 w-4" />
              지급 엑셀
            </Link>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
          <StatCard label="총 리뷰 요청" value={`${stats.total.toLocaleString("ko-KR")}건`} />
          <BreakdownCard title="방문경로" items={stats.visitRouteItems} />
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

        <div>
          <section className="overflow-hidden rounded-[24px] border border-white/70 bg-white/75 shadow-sm backdrop-blur sm:rounded-[28px]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">
                신청 목록 {loading ? "" : `${filteredRows.length.toLocaleString("ko-KR")}건`}
              </div>
            </div>

            <div className="space-y-2 p-3 lg:hidden">
              {pagedRows.map((row) => {
                const active = selected?.id === row.id;

                return (
                  <div
                    key={row.id}
                    onClick={() => {
                      openDetail(row.id);
                    }}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition ${
                      active
                        ? "border-pink-200 bg-pink-50"
                        : "border-slate-100 bg-white hover:border-pink-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(row.id);
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
                          <label
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-2 text-xs font-black text-sky-700"
                          >
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

                    <div className="mt-2 text-sm font-bold text-slate-500">
                      방문경로: <span className="text-slate-800">{visitRouteLabel(row.visitRoute)}</span>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          markPaidByIds([row.id]);
                        }}
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
              <table className="w-full min-w-[1060px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">선택</th>
                    <th className="px-4 py-3">신청일</th>
                    <th className="px-4 py-3">전화번호</th>
                    <th className="px-4 py-3">예약번호</th>
                    <th className="px-4 py-3">금액</th>
                    <th className="px-4 py-3">혜택</th>
                    <th className="px-4 py-3">방문경로</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedRows.map((row) => {
                    const active = selected?.id === row.id;

                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        aria-label={`신청 #${row.id} 상세 열기`}
                        onClick={() => {
                          openDetail(row.id);
                        }}
                        onKeyDown={(keyboardEvent) => {
                          if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                            keyboardEvent.preventDefault();
                            openDetail(row.id);
                          }
                        }}
                        className={`cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-300 ${active ? "bg-pink-50/80" : "hover:bg-slate-50"}`}
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
                            <span aria-hidden="true" />
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
                        <td className="px-4 py-3 font-bold text-slate-700">{visitRouteLabel(row.visitRoute)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>
                            {statusLabels[row.status] || row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.status === "PAYMENT_PENDING" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                markPaidByIds([row.id]);
                              }}
                              disabled={actionLoading || loading}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-xl bg-sky-600 px-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              지급완료
                            </button>
                          ) : (
                            <span aria-hidden="true" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && filteredRows.length === 0 ? (
              <div className="px-5 py-12 text-center sm:py-16">
                <div className="text-lg font-black text-slate-900">조회된 리뷰 이벤트가 없습니다</div>
                <div className="mt-2 text-sm font-bold text-slate-500">
                  상태나 전화번호 조건을 바꿔 다시 조회해 주세요.
                </div>
              </div>
            ) : null}
            {!loading && filteredRows.length > 0 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredRows.length}
                pageSize={PAGE_SIZE}
                onChange={setPage}
              />
            ) : null}
          </section>
        </div>
      </div>

      {detailOpen && modalEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`리뷰 신청 #${modalEvent.id} 상세`}
          aria-busy={detailLoading}
        >
          <div className="flex h-dvh max-h-dvh w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-[32px] sm:border sm:border-white/70">
            <div className="z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:px-5 sm:py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-900">신청 #{modalEvent.id} 상세</div>
                {detailLoading ? (
                  <div className="mt-0.5 text-xs font-bold text-slate-400">최신 이력을 불러오는 중...</div>
                ) : null}
              </div>
              <div className="flex justify-end">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeDetail}
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div
              ref={detailScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:p-3"
            >
              <ReviewDetail
                key={modalEvent.id}
                event={modalEvent}
                reason={reason}
                disabled={actionLoading || loading || detailLoading || !detailEvent}
                onChangeReason={setReason}
                onApprove={(event) => {
                  if (confirmApprove(event)) {
                    void runAction(() => approveReviewEvent(event.id), "승인 처리했습니다.", {
                      clearReason: true,
                      detailBehavior: "advance",
                      eventId: event.id,
                    });
                  }
                }}
                onManualApprove={(event, input) => {
                  if (confirmManualApprove(event, input)) {
                    void runAction(
                      () => manualApproveReviewEvent(event.id, input),
                      "수동 승인 처리했습니다.",
                      { clearReason: true, detailBehavior: "advance", eventId: event.id }
                    );
                  }
                }}
                onReject={(event) => {
                  if (confirmReject(event, reason)) {
                    void runAction(() => rejectReviewEvent(event.id, reason), "반려 처리했습니다.", {
                      clearReason: true,
                      detailBehavior: "advance",
                      eventId: event.id,
                    });
                  }
                }}
                onCancelReject={(event) => {
                  if (confirmCancelReject(event)) {
                    void runAction(
                      () => cancelRejectReviewEvent(event.id),
                      "반려를 취소했습니다.",
                      { clearReason: true, detailBehavior: "advance", eventId: event.id }
                    );
                  }
                }}
                onMarkPaid={(event) => markPaidByIds([event.id])}
                onCopyAccount={(account) => void copyAccount(account)}
                onSaveAccount={(event, account) => {
                  return runAction(
                    () => updateReviewEventAccount(event.id, account),
                    "계좌정보를 수정했습니다.",
                    { detailBehavior: "refresh-current", eventId: event.id }
                  );
                }}
                onPreview={(title, src) => setPreviewImage({ title, src })}
              />
            </div>
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

      {copyToast ? (
        <div className="fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4 sm:bottom-6">
          <div
            className={`rounded-full px-5 py-3 text-sm font-black text-white shadow-2xl ${
              copyToast.type === "ok" ? "bg-slate-950" : "bg-rose-600"
            }`}
          >
            {copyToast.text}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <div className="text-xs font-black text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: Array<[string, number]>;
}) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <div className="text-xs font-black text-slate-500">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map(([label, count]) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700"
            >
              {label}
              <span className="text-slate-400">{count.toLocaleString("ko-KR")}</span>
            </span>
          ))
        ) : (
          <span className="text-sm font-bold text-slate-400">없음</span>
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => {
    if (totalPages <= 7) return true;
    return item === 1 || item === totalPages || Math.abs(item - page) <= 2;
  });

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs font-bold text-slate-500">
        {start.toLocaleString("ko-KR")}-{end.toLocaleString("ko-KR")} / {totalItems.toLocaleString("ko-KR")}건
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="min-h-[36px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        {pages.map((item, index) => {
          const prev = pages[index - 1];
          const needsGap = prev && item - prev > 1;
          return (
            <div key={item} className="flex items-center gap-2">
              {needsGap ? <span className="text-xs font-black text-slate-300">...</span> : null}
              <button
                type="button"
                onClick={() => onChange(item)}
                className={`grid h-9 min-w-9 place-items-center rounded-xl px-3 text-xs font-black shadow-sm ${
                  item === page
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="min-h-[36px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}

function ReviewDetail({
  event,
  reason,
  disabled,
  onChangeReason,
  onApprove,
  onManualApprove,
  onReject,
  onCancelReject,
  onMarkPaid,
  onCopyAccount,
  onSaveAccount,
  onPreview,
}: {
  event: ReviewEvent | null;
  reason: string;
  disabled: boolean;
  onChangeReason: (value: string) => void;
  onApprove: (event: ReviewEvent) => void;
  onManualApprove: (event: ReviewEvent, input: ReviewEventManualApproveInput) => void;
  onReject: (event: ReviewEvent) => void;
  onCancelReject: (event: ReviewEvent) => void;
  onMarkPaid: (event: ReviewEvent) => void;
  onCopyAccount: (account: string) => void;
  onSaveAccount: (event: ReviewEvent, account: ReviewEventAccountInput) => Promise<boolean>;
  onPreview: (title: string, src: string) => void;
}) {
  const approvalInputRef = useRef<HTMLDivElement | null>(null);
  const [manualRewardSelection, setManualRewardSelection] = useState<{
    eventId: number;
    value: ReviewEventRewardType;
  } | null>(null);

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

  const activeEvent = event;

  const finalized = Boolean(event.paidAt || event.rewardedAt || event.couponId);
  const canApprove = event.status === "REVIEW_PENDING";
  const canReject =
    !finalized && (
      event.status === "REVIEW_PENDING"
      || event.status === "APPROVED"
      || event.status === "PAYMENT_PENDING"
    );
  const canCancelReject = !finalized && event.status === "REJECTED";
  const canManualApprove =
    !finalized && (event.status === "PROOF_SENT" || event.status === "REJECTED");
  const canMarkPaid = event.status === "PAYMENT_PENDING";
  const savedRewardType = event.rewardType === "CASH" || event.rewardType === "COUPON"
    ? event.rewardType
    : "";
  const manualRewardType = savedRewardType || (
    manualRewardSelection?.eventId === event.id ? manualRewardSelection.value : ""
  );
  const hasCompleteAccount = hasCompleteReviewAccount(event);
  const manualReason = reason.trim();
  const manualCashMissingAccount = manualRewardType === "CASH" && !hasCompleteAccount;
  const canSubmitManualApprove = Boolean(
    canManualApprove
    && manualReason
    && manualRewardType
  );
  const accountInputPending = event.status === "APPROVED"
    && event.rewardType === "CASH"
    && !hasCompleteAccount;
  const canProceedWithoutAccount = canApprove || canManualApprove;

  function continueWithoutAccount() {
    if (canApprove) {
      onApprove(activeEvent);
      return;
    }

    if (canSubmitManualApprove && manualRewardType) {
      onManualApprove(activeEvent, {
        reason: manualReason,
        rewardType: manualRewardType,
      });
      return;
    }

    approvalInputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const continueWithoutAccountLabel = canApprove
    ? "계좌 없이 승인"
    : canSubmitManualApprove
      ? "계좌 없이 수동 승인"
      : "계좌 입력 건너뛰기";
  return (
    <aside className="bg-white p-4 sm:rounded-[28px] sm:border sm:border-white/70 sm:bg-white/75 sm:p-5 sm:shadow-sm sm:backdrop-blur">
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
        <Info label="방문경로" value={visitRouteLabel(event.visitRoute)} />
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
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

      <AccountInfoCard
        key={`${event.id}-${event.bankName}-${event.accountNumber}-${event.accountHolder}`}
        event={event}
        disabled={disabled}
        onCopy={onCopyAccount}
        onSave={onSaveAccount}
        onContinueWithoutAccount={canProceedWithoutAccount ? continueWithoutAccount : undefined}
        continueWithoutAccountLabel={continueWithoutAccountLabel}
      />

      {accountInputPending ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-extrabold leading-6 text-amber-900">
          승인은 완료됐지만 계좌정보가 없어 지급대기에는 포함되지 않습니다. 계좌정보를 저장하면 자동으로 지급대기로 이동합니다.
        </div>
      ) : null}

      <div ref={approvalInputRef} className="mt-4 scroll-mt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black text-slate-900">
            {canManualApprove ? "수동 승인 사유 (필수)" : "새 처리 사유"}
          </div>
          {canManualApprove ? (
            <div className="text-xs font-bold text-slate-400">{reason.length}/500</div>
          ) : null}
        </div>
        <textarea
          value={reason}
          onChange={(event) => onChangeReason(event.target.value)}
          placeholder={
            canManualApprove
              ? "예: 전화 또는 문자로 리뷰 완료를 확인함"
              : "반려 또는 중복 처리 사유"
          }
          maxLength={500}
          disabled={disabled}
          className="mt-2 min-h-[88px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-pink-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {canManualApprove ? (
        <fieldset className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <legend className="px-1 text-sm font-black text-slate-900">수동 승인 혜택</legend>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
            전화·문자 등 별도 경로로 리뷰 완료를 확인한 경우에만 사용하세요.
          </p>
          {savedRewardType ? (
            <div className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-extrabold text-emerald-700 shadow-sm">
              <span>{savedRewardType === "CASH" ? "현금 지급" : "할인쿠폰"}</span>
              <span className="text-xs text-slate-500">고객 선택 · 변경 불가</span>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                { value: "CASH", label: "현금 지급" },
                { value: "COUPON", label: "할인쿠폰" },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-extrabold transition focus-within:ring-2 focus-within:ring-emerald-300 ${
                    manualRewardType === option.value
                      ? "border-emerald-500 bg-white text-emerald-700 shadow-sm"
                      : "border-emerald-100 bg-white/70 text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`manual-reward-${event.id}`}
                    value={option.value}
                    checked={manualRewardType === option.value}
                    onChange={() => setManualRewardSelection({
                      eventId: event.id,
                      value: option.value,
                    })}
                    disabled={disabled}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
          {!manualRewardType ? (
            <p className="mt-3 text-xs font-extrabold leading-5 text-amber-800">
              지급할 혜택을 선택해주세요.
            </p>
          ) : !manualReason ? (
            <p className="mt-3 text-xs font-extrabold leading-5 text-amber-800">
              수동 승인 사유를 입력해주세요.
            </p>
          ) : manualCashMissingAccount ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-extrabold leading-5 text-amber-800">
              계좌정보 없이 계좌입력대기로 승인됩니다. 나중에 계좌정보를 저장하면 지급대기로 이동합니다.
            </p>
          ) : manualRewardType === "COUPON" ? (
            <p className="mt-3 text-xs font-bold leading-5 text-emerald-800">
              승인하면 할인쿠폰이 즉시 발급됩니다.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <ProcessingHistory
        items={event.processingHistory || []}
        currentReason={event.rejectReason}
      />

      {event.duplicateFlags?.length ? (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          중복 의심: {event.duplicateFlags.join(", ")}
        </div>
      ) : null}

      <div
        className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-slate-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
      >
        {canManualApprove ? (
          <div className={`grid gap-2 ${canCancelReject ? "sm:grid-cols-2" : ""}`}>
            {canCancelReject ? (
              <button
                type="button"
                onClick={() => onCancelReject(event)}
                disabled={disabled}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-extrabold text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                반려취소
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (!manualRewardType) return;
                onManualApprove(event, {
                  reason: manualReason,
                  rewardType: manualRewardType,
                });
              }}
              disabled={disabled || !canSubmitManualApprove}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              수동 승인
            </button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onApprove(event)}
              disabled={disabled || !canApprove}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              승인
            </button>
            <button
              type="button"
              onClick={() => onReject(event)}
              disabled={disabled || !canReject}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-extrabold text-rose-700 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              반려
            </button>
          </div>
        )}
        {canMarkPaid ? (
          <button
            type="button"
            onClick={() => onMarkPaid(event)}
            disabled={disabled}
            className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            지급완료
          </button>
        ) : null}
      </div>

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

function AccountInfoCard({
  event,
  disabled,
  onCopy,
  onSave,
  onContinueWithoutAccount,
  continueWithoutAccountLabel,
}: {
  event: ReviewEvent;
  disabled: boolean;
  onCopy: (value: string) => void;
  onSave: (event: ReviewEvent, account: ReviewEventAccountInput) => Promise<boolean>;
  onContinueWithoutAccount?: () => void;
  continueWithoutAccountLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState(event.bankName || "");
  const [accountNumber, setAccountNumber] = useState(event.accountNumber || "");
  const [accountHolder, setAccountHolder] = useState(event.accountHolder || "");
  const accountText = formatAccount(event);
  const canCopy = accountText !== "-";
  const accountEditable = !(
    event.status === "PAID"
    || event.status === "REWARDED"
    || event.paidAt
    || event.rewardedAt
    || event.couponId
  );
  const canSave = Boolean(bankName.trim() && accountNumber.trim() && accountHolder.trim());

  function cancelEdit() {
    setBankName(event.bankName || "");
    setAccountNumber(event.accountNumber || "");
    setAccountHolder(event.accountHolder || "");
    setEditing(false);
  }

  async function saveAccount() {
    if (!canSave || disabled || saving) return;
    setSaving(true);
    try {
      const saved = await onSave(event, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
      if (saved) {
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-500">계좌정보 (선택)</div>
        {!editing ? (
          <div className="flex items-center gap-1.5">
            {canCopy ? (
              <button
                type="button"
                onClick={() => onCopy(accountText)}
                className="inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-black text-sky-600 transition hover:bg-sky-50"
              >
                복사
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setEditing(true);
              }}
              disabled={disabled || !accountEditable}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              {canCopy ? "수정" : "선택 입력"}
            </button>
          </div>
        ) : null}
      </div>

      {!editing ? (
        <>
          <div className="mt-1 break-words text-sm font-black text-slate-900">
            {canCopy
              ? accountText
              : onContinueWithoutAccount
                ? "미입력 · 계좌 없이 승인 가능"
                : "미입력"}
          </div>
          {!accountEditable ? (
            <div className="mt-1.5 text-xs font-bold text-slate-400">
              지급이 완료된 신청 건은 계좌정보를 수정할 수 없습니다.
            </div>
          ) : null}
        </>
      ) : (
        <form
          className="mt-3"
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            void saveAccount();
          }}
        >
          <div className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-xs font-extrabold leading-5 text-sky-800">
            계좌는 선택사항입니다. 계좌를 저장할 때만 은행명·예금주·계좌번호를 모두 입력해주세요.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">은행명</span>
              <input
                value={bankName}
                onChange={(changeEvent) => setBankName(changeEvent.target.value)}
                maxLength={50}
                required
                autoComplete="off"
                placeholder="예: 국민은행"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none focus:border-pink-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">예금주</span>
              <input
                value={accountHolder}
                onChange={(changeEvent) => setAccountHolder(changeEvent.target.value)}
                maxLength={100}
                required
                autoComplete="off"
                placeholder="예금주명"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none focus:border-pink-300"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-500">계좌번호</span>
              <input
                value={accountNumber}
                onChange={(changeEvent) => setAccountNumber(changeEvent.target.value)}
                maxLength={100}
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="계좌번호"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 outline-none focus:border-pink-300"
              />
            </label>
          </div>
          <div className="mt-2 text-xs font-bold text-slate-400">
            저장한 변경은 처리 이력에 기록됩니다.
          </div>
          {onContinueWithoutAccount ? (
            <button
              type="button"
              onClick={() => {
                cancelEdit();
                window.requestAnimationFrame(onContinueWithoutAccount);
              }}
              disabled={disabled || saving}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {continueWithoutAccountLabel}
            </button>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={disabled || saving}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canCopy ? "수정 취소" : "입력 취소"}
            </button>
            <button
              type="submit"
              disabled={disabled || saving || !canSave}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ProcessingHistory({
  items,
  currentReason,
}: {
  items: ReviewEventProcessingHistory[];
  currentReason?: string | null;
}) {
  const hasCurrentReason = Boolean(
    currentReason
    && items.some(
      (item) =>
        (item.action === "review_event.rejected" || item.action === "review_event.duplicated")
        && item.reason === currentReason
    )
  );
  const visibleItems = currentReason && !hasCurrentReason
    ? [{ id: -1, action: "review_event.rejected", actor: "", reason: currentReason, at: null }, ...items]
    : items;

  return (
    <section className="mt-5">
      <div className="flex items-center gap-2 text-sm font-black text-slate-900">
        <Clock3 className="h-4 w-4 text-slate-400" />
        처리 이력
      </div>
      {visibleItems.length > 0 ? (
        <div className="mt-2 space-y-2">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-black text-slate-800">
                  {processingActionLabel(item.action)}
                </div>
                {item.at ? (
                  <div className="text-xs font-bold text-slate-400">{formatDate(item.at)}</div>
                ) : null}
              </div>
              {item.reason ? (
                <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-600">
                  {item.reason}
                </div>
              ) : null}
              {item.actor ? (
                <div className="mt-1 text-xs font-bold text-slate-400">
                  처리자: {processingActorLabel(item.actor)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm font-bold text-slate-400">
          아직 처리 이력이 없습니다.
        </div>
      )}
    </section>
  );
}

function processingActionLabel(action: string) {
  return processingActionLabels[action] || action;
}

function processingActorLabel(actor: string) {
  if (actor === "locker-admin" || actor === "admin") return "관리자";
  if (actor === "kakao") return "카카오 신청자";
  if (actor === "system") return "시스템";
  return actor;
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

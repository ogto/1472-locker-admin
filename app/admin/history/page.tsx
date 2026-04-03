"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginCard } from "@/components/auth/login-card";
import { HistorySummaryCards } from "@/components/history/history-summary";
import { HistoryFilterBar } from "@/components/history/history-filter-bar";
import { HistoryTable } from "@/components/history/history-table";
import { HistoryPagination } from "@/components/history/history-pagination";
import { HistoryEmptyState } from "@/components/history/history-empty-state";
import {
  fetchReserveHistory,
  fetchReserveHistoryDetail,
  fetchReserveHistorySummary,
} from "@/lib/history/api";
import { mapHistoryItem } from "@/lib/history/mapper";
import type {
  HistoryDetailItem,
  HistoryFilterValue,
  HistoryItem,
  HistoryPageResponse,
  HistorySummary,
  HistoryViewItem,
} from "@/lib/history/types";

const PAGE_SIZE = 20;

function getTodayText() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function createEmptySummary(): HistorySummary {
  return {
    reservationCount: 0,
    storageCount: 0,
    coldCount: 0,
    roomCount: 0,
    carrierCount: 0,
    pickupCount: 0,
    coldCanceledCount: 0,
    roomCanceledCount: 0,
    carrierCanceledCount: 0,
    pickupCanceledCount: 0,
    completedCount: 0,
    pickupDoneCount: 0,
    pendingCount: 0,
    canceledCount: 0,
  };
}

export default function AdminHistoryPage() {
  const auth = useAdminAuth();

  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<HistoryFilterValue>({
    point: "bank",
    reservationStartDay: "",
    reservationEndDay: "",
    searchQuery: "",
    reservationStatus: "",
  });

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [paging, setPaging] = useState<HistoryPageResponse | null>(null);
  const [summary, setSummary] = useState<HistorySummary>(createEmptySummary());
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [detailById, setDetailById] = useState<Record<number, HistoryDetailItem[]>>(
    {}
  );
  const [detailErrorById, setDetailErrorById] = useState<Record<number, string>>(
    {}
  );

  async function loadHistory(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setErrorText("");
    setExpandedId(null);
    setDetailLoadingId(null);
    setDetailById({});
    setDetailErrorById({});

    try {
      const [historyResult, summaryResult] = await Promise.all([
        fetchReserveHistory({
          page: nextPage,
          size: PAGE_SIZE,
          point: nextFilters.point,
          reservationStartDay: nextFilters.reservationStartDay || undefined,
          reservationEndDay: nextFilters.reservationEndDay || undefined,
          searchQuery: nextFilters.searchQuery.trim() || undefined,
          reservationStatus: nextFilters.reservationStatus || undefined,
        }),
        fetchReserveHistorySummary({
          point: nextFilters.point,
          reservationStartDay: nextFilters.reservationStartDay || undefined,
          reservationEndDay: nextFilters.reservationEndDay || undefined,
          searchQuery: nextFilters.searchQuery.trim() || undefined,
          reservationStatus: nextFilters.reservationStatus || undefined,
        }),
      ]);

      const nextRows = Array.isArray(historyResult.content)
        ? historyResult.content
        : [];

      setRows(nextRows);
      setPaging(historyResult);
      setSummary(summaryResult);
      setPage(nextPage);
    } catch (error) {
      setRows([]);
      setPaging(null);
      setSummary(createEmptySummary());
      setErrorText(
        error instanceof Error
          ? error.message
          : "이용내역 조회에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDetail(item: HistoryViewItem) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(item.id);

    if (detailById[item.id]) {
      return;
    }

    setDetailLoadingId(item.id);
    setDetailErrorById((prev) => ({
      ...prev,
      [item.id]: "",
    }));

    try {
      const detail = await fetchReserveHistoryDetail(
        item.id,
        item.raw.point || filters.point
      );

      setDetailById((prev) => ({
        ...prev,
        [item.id]: detail,
      }));
    } catch (error) {
      setDetailErrorById((prev) => ({
        ...prev,
        [item.id]:
          error instanceof Error
            ? error.message
            : "이용내역 상세 조회에 실패했습니다.",
      }));
    } finally {
      setDetailLoadingId(null);
    }
  }

  useEffect(() => {
    setMounted(true);
    const today = getTodayText();
    setFilters((prev) => ({
      ...prev,
      reservationStartDay: today,
      reservationEndDay: today,
    }));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!auth.booting && auth.authenticated) {
      void loadHistory(0, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, auth.booting, auth.authenticated]);

  const viewItems = useMemo(() => rows.map(mapHistoryItem), [rows]);

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
    <AdminShell role={auth.role}>
      <AdminHeader title="이용내역" onLogout={auth.handleLogout} />

      <div className="space-y-4 lg:space-y-6">
        <HistorySummaryCards {...summary} />

        <HistoryFilterBar
          value={filters}
          loading={loading}
          onChange={setFilters}
          onSearch={() => {
            setPage(0);
            void loadHistory(0, filters);
          }}
          onReset={() => {
            const today = getTodayText();

            const resetValue: HistoryFilterValue = {
              point: "bank",
              reservationStartDay: today,
              reservationEndDay: today,
              searchQuery: "",
              reservationStatus: "",
            };

            setFilters(resetValue);
            setPage(0);
            void loadHistory(0, resetValue);
          }}
        />

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}

        {loading ? (
          <HistoryEmptyState
            title="이용내역을 불러오는 중입니다"
            description="잠시만 기다려 주세요."
          />
        ) : viewItems.length === 0 ? (
          <HistoryEmptyState
            title="조회된 이용내역이 없습니다"
            description="지점, 기간, 상태, 검색어를 바꿔서 다시 확인해 주세요."
          />
        ) : (
          <>
            <HistoryTable
              items={viewItems}
              expandedId={expandedId}
              detailLoadingId={detailLoadingId}
              detailErrorById={detailErrorById}
              detailById={detailById}
              onToggleDetail={handleToggleDetail}
            />

            <div className="rounded-[28px] bg-white/70 p-4 shadow-sm">
              <div className="mb-4 text-center text-sm font-bold text-slate-500">
                총 {paging?.totalElements ?? 0}건 · {page + 1} /{" "}
                {paging?.totalPages ?? 1} 페이지
              </div>

              <HistoryPagination
                page={page}
                totalPages={paging?.totalPages ?? 1}
                onChange={(nextPage) => {
                  setPage(nextPage);
                  void loadHistory(nextPage, filters);
                }}
              />
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
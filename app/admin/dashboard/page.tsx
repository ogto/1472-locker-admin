"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardStorageCard } from "@/components/dashboard/dashboard-storage-card";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardDetailModal } from "@/components/dashboard/dashboard-detail-modal";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  fetchReserveUser,
  fetchReserveUserDetail,
} from "@/lib/dashboard/api";
import {
  buildDashboardSummary,
  mapReserveUserItem,
} from "@/lib/dashboard/mapper";
import { formatChannel } from "@/lib/common";
import type {
  DashboardItem,
  DashboardStorageCounts,
  ReserveUserDetailItem,
  ReserveUserItem,
  ZoneKey,
} from "@/lib/dashboard/types";

function matchesCardFilter(item: DashboardItem, filter: ZoneKey) {
  if (filter === "all") return true;
  if (filter === "app") return formatChannel(item.os) === "앱";
  if (filter === "kiosk") return formatChannel(item.os) === "키오스크";
  if (filter === "pickup") return item.raw.pickupProduct === true;
  if (filter === "cold") return item.raw.type === 0;
  if (filter === "room") return item.raw.type === 1;
  if (filter === "carrier") return item.raw.type === 2;
  return true;
}

export default function AdminDashboardPage() {
  const auth = useAdminAuth();

  const [rows, setRows] = useState<ReserveUserItem[]>([]);
  const [counts, setCounts] = useState<DashboardStorageCounts>({
    cold: 0,
    room: 0,
    carrier: 0,
    pickup: 0,
  });

  const [filter, setFilter] = useState<ZoneKey>("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [selected, setSelected] = useState<DashboardItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrorText, setDetailErrorText] = useState("");
  const [detailData, setDetailData] = useState<ReserveUserDetailItem[]>([]);

  useEffect(() => {
    if (!auth.booting && auth.authenticated) {
      void loadDashboard();
    }
  }, [auth.booting, auth.authenticated]);

  async function loadDashboard() {
    setLoading(true);
    setErrorText("");

    try {
      const response = await fetchReserveUser();
      setRows(response.items);
      setCounts(response.counts);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "대시보드 조회에 실패했습니다."
      );
      setRows([]);
      setCounts({
        cold: 0,
        room: 0,
        carrier: 0,
        pickup: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(item: DashboardItem) {
    setSelected(item);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailErrorText("");
    setDetailData([]);

    try {
      const result = await fetchReserveUserDetail(item.id, "bank");
      setDetailData(result);
    } catch (error) {
      setDetailErrorText(
        error instanceof Error ? error.message : "상세 조회에 실패했습니다."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const items = useMemo<DashboardItem[]>(() => {
    const mapped = rows.map(mapReserveUserItem);

    mapped.sort((a, b) => {
      const aDate = `${a.reservationDay} ${a.reservationStartTime}`;
      const bDate = `${b.reservationDay} ${b.reservationStartTime}`;
      return bDate.localeCompare(aDate);
    });

    return mapped;
  }, [rows]);

  const summary = useMemo(
    () => buildDashboardSummary(items, counts),
    [items, counts]
  );

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchFilter = matchesCardFilter(item, filter);

      const matchKeyword =
        normalizedKeyword.length === 0
          ? true
          : [
              String(item.reserveId ?? ""),
              item.customerName,
              item.tel,
              item.password,
            ].some((value) => value.toLowerCase().includes(normalizedKeyword));

      return matchFilter && matchKeyword;
    });
  }, [items, filter, keyword]);

  if (auth.booting) {
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
      <AdminHeader title="보관함 현황" onLogout={auth.handleLogout} />

      <div className="space-y-4 lg:space-y-6">
        <DashboardSummaryCards
          {...summary}
          filter={filter}
          onChangeFilter={setFilter}
        />

        <DashboardFilterBar
          filter={filter}
          keyword={keyword}
          onChangeFilter={setFilter}
          onChangeKeyword={setKeyword}
          onRefresh={loadDashboard}
          loading={loading}
        />

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}

        {loading ? (
          <DashboardEmptyState
            title="현황을 불러오는 중입니다"
            description="잠시만 기다려 주세요."
          />
        ) : filteredItems.length === 0 ? (
          <DashboardEmptyState
            title="표시할 데이터가 없습니다"
            description="선택한 카드 필터나 검색어를 다시 확인해 주세요."
          />
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredItems.map((item) => (
              <DashboardStorageCard
                key={item.id}
                item={item}
                onClick={() => void openDetail(item)}
              />
            ))}
          </section>
        )}
      </div>

      <DashboardDetailModal
        open={detailOpen}
        loading={detailLoading}
        errorText={detailErrorText}
        data={detailData}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
          setDetailData([]);
          setDetailErrorText("");
        }}
      />
    </AdminShell>
  );
}
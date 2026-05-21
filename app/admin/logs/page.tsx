"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginCard } from "@/components/auth/login-card";
import { fetchReserveHistory, fetchReserveHistoryDetail } from "@/lib/history/api";
import { formatHistoryStatus } from "@/lib/history/mapper";
import type { HistoryItem } from "@/lib/history/types";

const PAGE_SIZE = 200;
const PICKUP_POINT = "bank";

type PickupGroup = {
  reserveId: number;
  customerName: string;
  tel: string;
  status: string;
  statusLabel: string;
  reservationTimeText: string;
  storageIds: number[];
  items: HistoryItem[];
};

function getTodayText() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTel(tel: string) {
  const value = String(tel || "").trim();
  if (!value) return "-";

  return value.replace(/(\d{3})-?(\d{3,4})-?(\d{4})/, "$1-$2-$3");
}

function isActivePickupItem(item: HistoryItem) {
  const status = item.reservationStatus || "";

  return (
    item.point === PICKUP_POINT &&
    item.pickupProduct === true &&
    status !== "CANCEL" &&
    status !== "CANCELED" &&
    status !== "PICKUP"
  );
}

function buildPickupGroups(items: HistoryItem[]): PickupGroup[] {
  const groups = new Map<number, PickupGroup>();

  for (const item of items.filter(isActivePickupItem)) {
    const reserveId = Number(item.reserveId || item.id);
    const existing = groups.get(reserveId);
    const storageId =
      typeof item.storageId === "number" && item.storageId > 0
        ? item.storageId
        : null;

    if (!existing) {
      groups.set(reserveId, {
        reserveId,
        customerName: item.mberNm?.trim() || "-",
        tel: item.tel || "",
        status: item.reservationStatus || "",
        statusLabel: formatHistoryStatus(item.reservationStatus),
        reservationTimeText: item.reservationStartTime || "-",
        storageIds: storageId ? [storageId] : [],
        items: [item],
      });
      continue;
    }

    existing.items.push(item);
    if (storageId && !existing.storageIds.includes(storageId)) {
      existing.storageIds.push(storageId);
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const sortedItems = group.items.sort(
        (a, b) => Number(a.storageId || 0) - Number(b.storageId || 0)
      );
      const aggregateStatus = getPickupGroupStatus(sortedItems);

      return {
        ...group,
        status: aggregateStatus,
        statusLabel: getPickupGroupStatusLabel(aggregateStatus),
        storageIds: group.storageIds.sort((a, b) => a - b),
        items: sortedItems,
      };
    })
    .sort((a, b) => {
      const timeCompare = a.reservationTimeText.localeCompare(
        b.reservationTimeText
      );
      if (timeCompare !== 0) return timeCompare;
      return a.reserveId - b.reserveId;
    });
}

function getPickupGroupStatus(items: HistoryItem[]) {
  const statuses = items.map((item) =>
    (item.reservationStatus || "").trim().toUpperCase()
  );

  if (statuses.length > 0 && statuses.every((status) => status === "PICKUP")) {
    return "PICKUP";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "DEPARTED")
  ) {
    return "DEPARTED";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "COLLECTED")
  ) {
    return "COLLECTED";
  }

  if (statuses.some((status) => status === "COLLECTED")) {
    return "COLLECTING";
  }

  if (statuses.some((status) => status === "PENDING")) {
    return "PENDING";
  }

  return "COMPLETED";
}

function getPickupGroupStatusLabel(status: string) {
  if (status === "COLLECTING") return "회수중";
  return formatHistoryStatus(status);
}

function getStatusClass(status: string) {
  if (status === "PENDING") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (status === "DEPARTED") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "COLLECTING") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "COLLECTED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "PICKUP") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "COMPLETED" || status === "READY") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "CANCEL" || status === "CANCELED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getPickupMapTheme(status: string) {
  if (status === "PENDING") {
    return {
      article: "border-slate-200 bg-slate-50/75",
      field: "border-slate-200 bg-slate-50/65",
      node: "border-slate-400 bg-white",
      storage: "border-slate-400 bg-white text-slate-950",
      line: "#cbd5e1",
    };
  }

  if (status === "PICKUP") {
    return {
      article: "border-emerald-200 bg-emerald-50/75",
      field: "border-emerald-200 bg-emerald-50/65",
      node: "border-emerald-500 bg-white",
      storage: "border-emerald-500 bg-white text-emerald-950",
      line: "#6ee7b7",
    };
  }

  if (status === "DEPARTED") {
    return {
      article: "border-violet-200 bg-violet-50/75",
      field: "border-violet-200 bg-violet-50/65",
      node: "border-violet-500 bg-white",
      storage: "border-violet-500 bg-white text-violet-950",
      line: "#c4b5fd",
    };
  }

  if (status === "COLLECTING") {
    return {
      article: "border-orange-200 bg-orange-50/75",
      field: "border-orange-200 bg-orange-50/65",
      node: "border-orange-500 bg-white",
      storage: "border-orange-500 bg-white text-orange-950",
      line: "#fdba74",
    };
  }

  if (status === "COLLECTED") {
    return {
      article: "border-amber-200 bg-amber-50/75",
      field: "border-amber-200 bg-amber-50/65",
      node: "border-amber-500 bg-white",
      storage: "border-amber-500 bg-white text-amber-950",
      line: "#fcd34d",
    };
  }

  return {
    article: "border-sky-200 bg-sky-50/75",
    field: "border-sky-200 bg-sky-50/65",
    node: "border-sky-500 bg-white",
    storage: "border-sky-500 bg-white text-sky-950",
    line: "#7dd3fc",
  };
}

function getStorageNodeTheme(status: string) {
  if (status === "PICKUP") {
    return "border-emerald-500 bg-white text-emerald-950";
  }

  if (status === "DEPARTED") {
    return "border-violet-500 bg-white text-violet-950";
  }

  if (status === "COLLECTED") {
    return "border-amber-500 bg-white text-amber-950";
  }

  if (status === "PENDING") {
    return "border-slate-400 bg-white text-slate-950";
  }

  return "border-sky-500 bg-white text-sky-950";
}

export default function AdminLogsPage() {
  const auth = useAdminAuth();
  const [mounted, setMounted] = useState(false);
  const [todayText, setTodayText] = useState("");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [selectedReserveId, setSelectedReserveId] = useState<number | null>(null);
  const [collectingHistoryId, setCollectingHistoryId] = useState<number | null>(
    null
  );
  const [modalErrorText, setModalErrorText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openingHistoryId, setOpeningHistoryId] = useState<number | null>(null);

  async function loadPickupStatus(targetDay = todayText || getTodayText()) {
    setLoading(true);
    setErrorText("");

    try {
      const firstPage = await fetchReserveHistory({
        page: 0,
        size: PAGE_SIZE,
        point: PICKUP_POINT,
        reservationStartDay: targetDay,
        reservationEndDay: targetDay,
        pickupProduct: "true",
        sortBy: "storageDateTime",
        sortDir: "asc",
      });

      const pageCount = Math.max(1, Number(firstPage.totalPages || 1));
      const nextItems = Array.isArray(firstPage.content)
        ? [...firstPage.content]
        : [];

      if (pageCount > 1) {
        const restPages = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            fetchReserveHistory({
              page: index + 1,
              size: PAGE_SIZE,
              point: PICKUP_POINT,
              reservationStartDay: targetDay,
              reservationEndDay: targetDay,
              pickupProduct: "true",
              sortBy: "storageDateTime",
              sortDir: "asc",
            })
          )
        );

        for (const page of restPages) {
          if (Array.isArray(page.content)) {
            nextItems.push(...page.content);
          }
        }
      }

      const pickupItems = nextItems.filter(isActivePickupItem);
      const reserveIds = Array.from(
        new Set(pickupItems.map((item) => item.reserveId).filter(Boolean))
      );
      const detailResults = await Promise.all(
        reserveIds.map((reserveId) =>
          fetchReserveHistoryDetail(reserveId, PICKUP_POINT)
        )
      );
      const detailItems = detailResults
        .flat()
        .filter(isActivePickupItem) as HistoryItem[];

      setItems(detailItems.length > 0 ? detailItems : pickupItems);
    } catch (error) {
      setItems([]);
      setErrorText(
        error instanceof Error
          ? error.message
          : "야구장픽업 현황 조회에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = getTodayText();
    setTodayText(today);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!auth.booting && auth.authenticated) {
      void loadPickupStatus(todayText || getTodayText());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, auth.booting, auth.authenticated, todayText]);

  const groups = useMemo(() => buildPickupGroups(items), [items]);
  const filteredGroups = useMemo(
    () => filterPickupGroups(groups, searchQuery),
    [groups, searchQuery]
  );
  const selectedGroup = useMemo(
    () =>
      selectedReserveId == null
        ? null
        : groups.find((group) => group.reserveId === selectedReserveId) ?? null,
    [groups, selectedReserveId]
  );

  async function handleCollectHistory(group: PickupGroup, historyId: number) {
    await updatePickupStatus(group, "COLLECTED", historyId);
  }

  async function handleDepart(group: PickupGroup) {
    await updatePickupStatus(group, "DEPARTED");
  }

  async function handlePickup(group: PickupGroup) {
    await updatePickupStatus(group, "PICKUP");
  }

  async function handleOpenLocker(item: HistoryItem) {
    if (!item.storageId) {
      setModalErrorText("보관함 번호가 없어 문을 열 수 없습니다.");
      return;
    }

    setOpeningHistoryId(item.id);
    setModalErrorText("");

    try {
      const response = await fetch("/api/lock-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          point: PICKUP_POINT,
          storageId: item.storageId,
          pulseMs: 500,
          requestedBy: "admin-web-baseball-pickup",
          requestNote: `야구장픽업 회수 문열기 (${item.storageId}번, history #${item.id})`,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.message || result?.detail || "보관함 문열기에 실패했습니다."
        );
      }
    } catch (error) {
      setModalErrorText(
        error instanceof Error ? error.message : "보관함 문열기에 실패했습니다."
      );
    } finally {
      setOpeningHistoryId(null);
    }
  }

  async function updatePickupStatus(
    group: PickupGroup,
    status: "COLLECTED" | "DEPARTED" | "PICKUP",
    historyId?: number
  ) {
    setCollectingHistoryId(historyId ?? 0);
    setModalErrorText("");

    try {
      const params = new URLSearchParams();
      params.set("point", PICKUP_POINT);
      params.set("reserveId", String(group.reserveId));
      params.set("status", status);
      if (historyId != null) {
        params.set("historyId", String(historyId));
      }

      const response = await fetch(
        `/api/dashboard/pickup-product/collect?${params.toString()}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "상태 변경에 실패했습니다.");
      }

      const updatedItems = Array.isArray(result.data)
        ? (result.data as HistoryItem[])
        : [];

      if (updatedItems.length > 0) {
        setItems((prev) => {
          const updatedById = new Map(updatedItems.map((item) => [item.id, item]));
          return prev.map((item) => updatedById.get(item.id) ?? item);
        });
      } else {
        await loadPickupStatus(todayText);
      }
    } catch (error) {
      setModalErrorText(
        error instanceof Error
          ? error.message
          : "상태 변경에 실패했습니다."
      );
    } finally {
      setCollectingHistoryId(null);
    }
  }

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
        title="야구장픽업"
        description={`${todayText} 은행점 오늘 야구장픽업 현황`}
        onLogout={auth.handleLogout}
      />

      <div className="space-y-4 lg:space-y-6">
        <section className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="min-w-0 flex-1">
              <span className="sr-only">야구장픽업 검색</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="이름, 전화번호, 예약번호, 보관함 번호 검색"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
              />
            </label>

            <button
              type="button"
              onClick={() => void loadPickupStatus(todayText)}
              disabled={loading}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "새로고침 중..." : "새로고침"}
            </button>
          </div>
        </section>

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}

        {loading ? (
          <EmptyPanel title="야구장픽업 현황을 불러오는 중입니다" />
        ) : groups.length === 0 ? (
          <EmptyPanel title="오늘 야구장픽업 예약이 없습니다" />
        ) : filteredGroups.length === 0 ? (
          <EmptyPanel title="검색 결과가 없습니다" />
        ) : (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredGroups.map((group) => (
              <PickupMap
                key={group.reserveId}
                group={group}
                onSelect={() => {
                  setSelectedReserveId(group.reserveId);
                  setModalErrorText("");
                }}
              />
            ))}
          </section>
        )}
      </div>

      {selectedGroup ? (
        <PickupCollectModal
          group={selectedGroup}
          loadingHistoryId={collectingHistoryId}
          openingHistoryId={openingHistoryId}
          errorText={modalErrorText}
          onClose={() => {
            if (collectingHistoryId == null) {
              setSelectedReserveId(null);
              setModalErrorText("");
            }
          }}
          onCollect={(historyId) => void handleCollectHistory(selectedGroup, historyId)}
          onOpenLocker={(item) => void handleOpenLocker(item)}
          onDepart={() => void handleDepart(selectedGroup)}
          onPickup={() => void handlePickup(selectedGroup)}
        />
      ) : null}
    </AdminShell>
  );
}

function normalizeSearchText(value: string) {
  return value.replace(/[\s-]/g, "").toLowerCase();
}

function filterPickupGroups(groups: PickupGroup[], query: string) {
  const keyword = normalizeSearchText(query.trim());
  if (!keyword) return groups;

  return groups.filter((group) => {
    const haystacks = [
      group.customerName,
      group.tel,
      String(group.reserveId),
      group.statusLabel,
      group.reservationTimeText,
      ...group.storageIds.map(String),
    ];

    return haystacks.some((value) =>
      normalizeSearchText(value).includes(keyword)
    );
  });
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/75 p-10 text-center shadow-sm">
      <div className="text-4xl">⚾</div>
      <div className="mt-3 text-xl font-black text-slate-900">{title}</div>
    </div>
  );
}

function PickupMap({
  group,
  onSelect,
}: {
  group: PickupGroup;
  onSelect: () => void;
}) {
  const theme = getPickupMapTheme(group.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-[28px] border p-4 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(15,23,42,0.11)]",
        theme.article,
      ].join(" ")}
    >
      <div
        className={[
          "relative min-h-[250px] overflow-hidden rounded-[24px] border border-dashed p-4",
          theme.field,
        ].join(" ")}
      >
        <div
          className={[
            "relative z-10 mx-auto w-full max-w-[300px] rounded-[24px] border-2 p-4 text-center shadow-sm",
            theme.node,
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="text-2xl font-black tracking-tight text-slate-950">
              {group.customerName}
            </div>
            <span
              className={[
                "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-black",
                getStatusClass(group.status),
              ].join(" ")}
            >
              {group.statusLabel}
            </span>
          </div>
          <div className="mt-2 text-sm font-extrabold text-slate-600">
            예약 #{group.reserveId}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-500">
            {formatTel(group.tel)} · {group.reservationTimeText}
          </div>
        </div>

        {group.items.length > 0 ? (
          <>
            <div
              className="mx-auto h-8 w-0.5"
              style={{ backgroundColor: theme.line }}
            />

            <div
              className={[
                "relative z-10 mx-auto w-fit max-w-full rounded-[24px] border border-dashed bg-white/55 p-3 shadow-sm",
                theme.field,
              ].join(" ")}
            >
              <div className="flex max-w-[360px] flex-wrap justify-center gap-2">
                {group.items.map((item) => {
                  const status = (item.reservationStatus || "")
                    .trim()
                    .toUpperCase();

                  return (
                    <span
                      key={item.id}
                      className={[
                        "inline-flex size-16 shrink-0 items-center justify-center rounded-[18px] border-2 text-[24px] font-black leading-none shadow-sm",
                        getStorageNodeTheme(status),
                      ].join(" ")}
                    >
                      {item.storageId ?? "-"}
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="relative z-10 mx-auto max-w-[280px] rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-center text-sm font-bold text-slate-500">
            아직 배정된 보관함 번호가 없습니다.
          </div>
        )}
      </div>
    </button>
  );
}

function PickupCollectModal({
  group,
  loadingHistoryId,
  openingHistoryId,
  errorText,
  onClose,
  onCollect,
  onOpenLocker,
  onDepart,
  onPickup,
}: {
  group: PickupGroup;
  loadingHistoryId: number | null;
  openingHistoryId: number | null;
  errorText: string;
  onClose: () => void;
  onCollect: (historyId: number) => void;
  onOpenLocker: (item: HistoryItem) => void;
  onDepart: () => void;
  onPickup: () => void;
}) {
  const [pickupConfirmOpen, setPickupConfirmOpen] = useState(false);
  const activeItems = group.items.filter(isActivePickupItem);
  const canDepart =
    activeItems.length > 0 &&
    activeItems.every((item) => {
      const status = (item.reservationStatus || "").trim().toUpperCase();
      return status === "COLLECTED" || status === "DEPARTED";
    }) &&
    group.status !== "DEPARTED" &&
    group.status !== "PICKUP";
  const canPickup = group.status === "DEPARTED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.48)] p-3 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-32px)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[24px] font-black tracking-tight text-slate-950">
              {group.customerName}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              예약 #{group.reserveId} · {formatTel(group.tel)}
            </div>
          </div>
          <span
            className={[
              "inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-black",
              getStatusClass(group.status),
            ].join(" ")}
          >
            {group.statusLabel}
          </span>
          </div>

          {errorText ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errorText}
            </div>
          ) : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {activeItems.map((item) => {
            const status = (item.reservationStatus || "").trim().toUpperCase();
            const collected = status === "COLLECTED";
            const locked =
              status === "DEPARTED" || status === "PICKUP" || status === "CANCELED";
            const loading = loadingHistoryId === item.id;
            const opening = openingHistoryId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-h-12 min-w-16 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white px-4 text-2xl font-black text-slate-950">
                      {item.storageId ?? "-"}
                    </span>
                    <span
                      className={[
                        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-black",
                        getStatusClass(status),
                      ].join(" ")}
                    >
                      {formatHistoryStatus(status)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-500">
                    history #{item.id}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenLocker(item)}
                    disabled={!item.storageId || openingHistoryId != null || loadingHistoryId != null}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {opening ? "요청 중..." : "문열기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCollect(item.id)}
                    disabled={collected || locked || loadingHistoryId != null || openingHistoryId != null}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {loading
                      ? "처리 중..."
                      : collected
                      ? "회수완료됨"
                      : locked
                      ? "처리불가"
                      : "회수완료"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setPickupConfirmOpen(true)}
            disabled={!canPickup || loadingHistoryId != null || openingHistoryId != null}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {loadingHistoryId === 0 ? "처리 중..." : "픽업완료"}
          </button>
          <button
            type="button"
            onClick={onDepart}
            disabled={!canDepart || loadingHistoryId != null || openingHistoryId != null}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-violet-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {loadingHistoryId === 0 ? "처리 중..." : "배송출발"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingHistoryId != null || openingHistoryId != null}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            닫기
          </button>
        </div>

        {pickupConfirmOpen ? (
          <PickupConfirmDialog
            loading={loadingHistoryId === 0}
            customerName={group.customerName}
            reserveId={group.reserveId}
            onCancel={() => {
              if (loadingHistoryId == null) {
                setPickupConfirmOpen(false);
              }
            }}
            onConfirm={() => {
              setPickupConfirmOpen(false);
              onPickup();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function PickupConfirmDialog({
  loading,
  customerName,
  reserveId,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  customerName: string;
  reserveId: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(15,23,42,0.42)] p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[22px] font-black tracking-tight text-slate-950">
          픽업완료 처리
        </div>
        <div className="mt-2 text-sm font-bold leading-6 text-slate-600">
          {customerName} 고객의 예약 #{reserveId}건을 픽업완료로 변경할까요?
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          처리 후 야구장픽업 진행 화면에서 해당 예약이 사라집니다.
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "처리 중..." : "픽업완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

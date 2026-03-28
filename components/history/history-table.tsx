import type React from "react";
import { HistoryDetailPanel } from "@/components/history/history-detail-panel";
import type { HistoryDetailItem, HistoryViewItem } from "@/lib/history/types";

type Props = {
  items: HistoryViewItem[];
  expandedId: number | null;
  detailLoadingId: number | null;
  detailErrorById: Record<number, string>;
  detailById: Record<number, HistoryDetailItem[]>;
  onToggleDetail: (item: HistoryViewItem) => void;
};

function Badge({
  text,
  tone,
}: {
  text: string;
  tone:
    | "slate"
    | "sky"
    | "amber"
    | "pink"
    | "emerald"
    | "rose"
    | "cyan"
    | "fuchsia";
}) {
  const toneClass =
    tone === "sky"
      ? "bg-sky-100 text-sky-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : tone === "pink"
      ? "bg-pink-100 text-pink-700"
      : tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "rose"
      ? "bg-rose-100 text-rose-700"
      : tone === "cyan"
      ? "bg-cyan-100 text-cyan-900"
      : tone === "fuchsia"
      ? "bg-fuchsia-100 text-fuchsia-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass}`}>
      {text}
    </span>
  );
}

function statusTone(statusLabel: string) {
  if (statusLabel === "보관중") return "emerald";
  if (statusLabel === "예약" || statusLabel === "찾기대기") return "cyan";
  if (statusLabel === "픽업완료" || statusLabel === "픽업") return "fuchsia";
  if (statusLabel === "취소") return "rose";
  return "slate";
}

function FragmentRow({
  row,
  detail,
}: {
  row: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <>
      {row}
      {detail}
    </>
  );
}

export function HistoryTable({
  items,
  expandedId,
  detailLoadingId,
  detailErrorById,
  detailById,
  onToggleDetail,
}: Props) {
  return (
    <>
      <section className="hidden overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-left">
                <th className="px-5 py-4 text-sm font-black text-slate-600">예약</th>
                <th className="px-5 py-4 text-sm font-black text-slate-600">고객</th>
                <th className="px-5 py-4 text-sm font-black text-slate-600">상태</th>
                <th className="px-5 py-4 text-sm font-black text-slate-600">보관일시</th>
                <th className="px-5 py-4 text-sm font-black text-slate-600">금액</th>
                <th className="px-5 py-4 text-sm font-black text-slate-600">상세</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const open = expandedId === item.id;

                return (
                  <FragmentRow
                    key={item.id}
                    row={
                      <tr
                        className="cursor-pointer border-t border-slate-100 transition hover:bg-pink-50/30"
                        onClick={() => onToggleDetail(item)}
                      >
                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] flex-col justify-center">
                            <div className="text-sm font-black text-slate-900">
                              #{item.reserveId}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              ID {item.id}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] flex-col justify-center">
                            <div className="text-sm font-black text-slate-900">
                              {item.customerName}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {item.tel}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] items-center">
                            <Badge
                              text={item.statusLabel}
                              tone={statusTone(item.statusLabel)}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] items-center text-sm font-black text-slate-900">
                            {item.reservationDateText}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] items-center text-sm font-black text-slate-900">
                            {item.priceText}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-h-[52px] items-center">
                            <button
                              type="button"
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDetail(item);
                              }}
                            >
                              {open ? "닫기" : "상세보기"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    detail={
                      open ? (
                        <tr className="border-t border-slate-100 bg-white">
                          <td colSpan={6} className="px-5 pb-5">
                            <HistoryDetailPanel
                              loading={detailLoadingId === item.id}
                              errorText={detailErrorById[item.id] || ""}
                              items={detailById[item.id] || []}
                            />
                          </td>
                        </tr>
                      ) : null
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 xl:hidden">
        {items.map((item) => {
          const open = expandedId === item.id;

          return (
            <article
              key={item.id}
              className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.08)]"
            >
              <button
                type="button"
                onClick={() => onToggleDetail(item)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {item.customerName}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">
                      #{item.reserveId} · {item.tel}
                    </div>
                  </div>

                  <Badge
                    text={item.statusLabel}
                    tone={statusTone(item.statusLabel)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                  <div>
                    <div className="text-xs font-black text-slate-400">보관일시</div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {item.reservationDateText}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-400">금액</div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {item.priceText}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm font-extrabold text-pink-500">
                  {open ? "상세 접기" : "상세 보기"}
                </div>
              </button>

              {open ? (
                <div className="mt-4">
                  <HistoryDetailPanel
                    loading={detailLoadingId === item.id}
                    errorText={detailErrorById[item.id] || ""}
                    items={detailById[item.id] || []}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </>
  );
}
import type {
  DashboardItem,
  DashboardStorageCounts,
  DashboardSummary,
  ReserveUserDetailItem,
  ReserveUserItem,
} from "./types";
import { formatChannel } from "../common";

function formatVisitText(visitSeq?: number | null) {
  return visitSeq && visitSeq > 0 ? `${visitSeq}번째 방문` : "-";
}

export function mapReserveUserItem(item: ReserveUserItem): DashboardItem {
  return {
    id: item.id,
    reserveId: item.reserveId ?? null,

    customerName: item.mberNm?.trim() || "-",
    tel: item.tel?.trim() || "-",
    os: item.os?.trim() || "",
    password: item.pwd?.trim() || "-",

    reservationStatus: item.reservationStatus?.trim() || "-",
    reservationDay: item.reservationDay?.trim() || "-",
    reservationStartTime: item.reservationStartTime?.trim() || "-",
    reservationTime: item.reservationTime ?? 0,

    price: item.price ?? 0,
    addPay: item.addPay ?? 0,

    memo: item.memo?.trim() || "-",
    ordId: item.ordId?.trim() || "-",
    visitText: formatVisitText(item.visitSeq),

    raw: item,
  };
}

export function buildDashboardSummary(
  items: DashboardItem[],
  counts?: DashboardStorageCounts
): DashboardSummary {
  const reservationKeys = new Set<string>();

  let app = 0;
  let kiosk = 0;

  for (const item of items) {
    const channel = formatChannel(item.os);

    if (channel === "앱") app += 1;
    if (channel === "키오스크") kiosk += 1;

    if (item.reserveId != null) {
      reservationKeys.add(String(item.reserveId));
    } else {
      reservationKeys.add(`row:${item.id}`);
    }
  }

  return {
    activeReservations: reservationKeys.size,
    app,
    kiosk,
    pickup: counts?.pickup ?? 0,
    cold: counts?.cold ?? 0,
    room: counts?.room ?? 0,
    carrier: counts?.carrier ?? 0,
  };
}

export function groupDetailByType(items: ReserveUserDetailItem[]) {
  return {
    cold: items.filter((item) => (item.type ?? 0) === 0),
    room: items.filter((item) => item.type === 1),
    carrier: items.filter((item) => item.type === 2),
  };
}

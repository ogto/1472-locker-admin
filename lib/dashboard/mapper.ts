import type {
  DashboardItem,
  DashboardSummary,
  ReserveUserDetailItem,
  ReserveUserItem,
} from "./types";

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

    raw: item,
  };
}

export function buildDashboardSummary(items: DashboardItem[]): DashboardSummary {
  return {
    total: items.length,
    app: items.filter((item) => formatChannel(item.os) === "앱").length,
    kiosk: items.filter((item) => formatChannel(item.os) === "키오스크").length,
    completed: items.filter((item) => formatStatus(item.reservationStatus) === "완료").length,
  };
}

export function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export function formatReservationDate(day: string, startTime: string) {
  if (!day || day === "-") return "-";
  if (!startTime || startTime === "-") return day;
  return `${day} ${startTime}`;
}

export function formatChannel(os: string) {
  const normalized = os.trim().toLowerCase();

  if (!normalized) return "-";

  if (normalized.includes("kiosk")) {
    return "키오스크";
  }

  if (
    normalized.includes("android") ||
    normalized.includes("ios") ||
    normalized.includes("app")
  ) {
    return "앱";
  }

  return os;
}

export function formatStatus(status: string) {
  if (!status || status === "-") return "-";

  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "보관중";
    case "RESERVED":
      return "예약";
    case "CANCEL":
    case "CANCELLED":
      return "취소";
    default:
      return status;
  }
}

export function formatStorageType(type?: number | null) {
  if (type === 1) return "상온";
  if (type === 2) return "캐리어";
  return "냉장";
}

export function groupDetailByType(items: ReserveUserDetailItem[]) {
  return {
    cold: items.filter((item) => (item.type ?? 0) === 0),
    room: items.filter((item) => item.type === 1),
    carrier: items.filter((item) => item.type === 2),
  };
}
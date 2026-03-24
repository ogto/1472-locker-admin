import type {
  HistoryDetailItem,
  HistoryDetailViewItem,
  HistoryItem,
  HistorySummary,
  HistoryViewItem,
} from "./types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function safeDateText(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export function formatHistoryType(type?: number | null) {
  if (type === 0) return "냉장";
  if (type === 1) return "상온";
  if (type === 2) return "캐리어";
  return "-";
}

export function formatHistoryPoint(point: string) {
  if (point === "bank") return "은행점";
  if (point === "sungsim") return "으능정이점";
  if (point === "baseball") return "한화생명볼파크점";
  return point || "-";
}

export function formatHistoryChannel(os: string) {
  if (!os) return "-";
  return os.toLowerCase() === "kiosk" ? "키오스크" : "앱";
}

export function formatHistoryStatus(status: string) {
  if (!status) return "-";
  if (status === "PENDING") return "대기";
  if (status === "COMPLETED") return "보관중";
  if (status === "READY") return "찾기대기";
  if (status === "PICKUP") return "픽업완료";
  if (status === "CANCEL" || status === "CANCELED") return "취소";
  return status;
}

export function mapHistoryItem(item: HistoryItem): HistoryViewItem {
  return {
    id: item.id,
    reserveId: item.reserveId,
    customerName: item.mberNm?.trim() || "-",
    tel: item.tel || "-",
    statusLabel: formatHistoryStatus(item.reservationStatus),
    osLabel: formatHistoryChannel(item.os),
    priceText: `${formatNumber(item.price || 0)}원`,
    reservationDateText: item.reservationDay
      ? `${item.reservationDay} ${item.reservationStartTime || ""}`.trim()
      : "-",
    raw: item,
  };
}

export function buildHistorySummary(items: HistoryItem[]): HistorySummary {
  const total = items.length;
  const app = items.filter(
    (item) => (item.os || "").toLowerCase() !== "kiosk"
  ).length;
  const kiosk = items.filter(
    (item) => (item.os || "").toLowerCase() === "kiosk"
  ).length;
  const pickup = items.filter((item) => item.pickupProduct).length;

  return {
    total,
    app,
    kiosk,
    pickup,
  };
}

export function mapHistoryDetailItem(
  item: HistoryDetailItem
): HistoryDetailViewItem {
  return {
    id: item.id,
    reserveId: item.reserveId,
    storageId: item.storageId,
    typeLabel: formatHistoryType(item.type),
    pointLabel: formatHistoryPoint(item.point),
    osLabel: formatHistoryChannel(item.os),
    statusLabel: formatHistoryStatus(item.reservationStatus),
    priceText: `${formatNumber(item.price || 0)}원`,
    addPayText: `${formatNumber(item.addPay || 0)}원`,
    createdAtText: safeDateText(item.createdAt),
    updateAtText: safeDateText(item.updateAt),
    reservationDateText: item.reservationDay
      ? `${item.reservationDay} ${item.reservationStartTime || ""}`.trim()
      : "-",
    pickupLabel: item.pickupProduct ? "픽업" : "일반",
    maskedPwd: item.pwd ? "●".repeat(String(item.pwd).length) : "-",
    memo: item.memo || "",
    ordId: item.ordId || "-",
  };
}
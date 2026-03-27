import type {
  HistoryDetailItem,
  HistoryDetailViewItem,
  HistoryItem,
  HistoryViewItem,
} from "./types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function safeDateText(value?: string) {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw) return "-";

  const normalDate = new Date(raw);
  if (!Number.isNaN(normalDate.getTime())) {
    const yyyy = normalDate.getFullYear();
    const mm = String(normalDate.getMonth() + 1).padStart(2, "0");
    const dd = String(normalDate.getDate()).padStart(2, "0");
    const hh = String(normalDate.getHours()).padStart(2, "0");
    const mi = String(normalDate.getMinutes()).padStart(2, "0");
    const ss = String(normalDate.getSeconds()).padStart(2, "0");

    return `${yyyy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
  }

  if (raw.includes(",")) {
    const parts = raw.split(",").map((v) => v.trim());

    if (parts.length >= 6) {
      const [year, month, day, hour, minute, second] = parts;

      const y = Number(year);
      const m = Number(month);
      const d = Number(day);
      const hh = Number(hour);
      const mi = Number(minute);
      const ss = Number(second);

      if (
        !Number.isNaN(y) &&
        !Number.isNaN(m) &&
        !Number.isNaN(d) &&
        !Number.isNaN(hh) &&
        !Number.isNaN(mi) &&
        !Number.isNaN(ss)
      ) {
        return `${String(y).padStart(4, "0")}.${String(m).padStart(
          2,
          "0"
        )}.${String(d).padStart(2, "0")} ${String(hh).padStart(
          2,
          "0"
        )}:${String(mi).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      }
    }
  }

  return raw;
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
  if (status === "PENDING") return "예약";
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
    priceText: `${formatNumber(item.price || 0)}원`,
    reservationDateText: item.reservationDay
      ? `${item.reservationDay} ${item.reservationStartTime || ""}`.trim()
      : "-",
    raw: item,
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
    pickupLabel: item.pickupProduct ? "픽업보관" : "일반보관",
    maskedPwd: item.pwd ? "●".repeat(String(item.pwd).length) : "-",
    memo: item.memo || "",
    ordId: item.ordId || "-",
  };
}
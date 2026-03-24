import type {
  DashboardItem,
  DashboardSummary,
  ReserveUserDetailItem,
  ReserveUserItem,
} from "./types";

import {formatChannel} from '../common';

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
  };
}

export function groupDetailByType(items: ReserveUserDetailItem[]) {
  return {
    cold: items.filter((item) => (item.type ?? 0) === 0),
    room: items.filter((item) => item.type === 1),
    carrier: items.filter((item) => item.type === 2),
  };
}
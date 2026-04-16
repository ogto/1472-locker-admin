export type ZoneKey =
  | "all"
  | "app"
  | "kiosk"
  | "pickup"
  | "cold"
  | "room"
  | "carrier";

export type ReserveUserItem = {
  addPay?: number | null;
  addPayOrdId?: string | null;
  addPayTof?: boolean | null;
  addPayType?: number | null;
  createdAt?: string | null;
  id: number;
  mberNm?: string | null;
  mberNo?: number | null;
  memo?: string | null;
  ordId?: string | null;
  os?: string | null;
  payType?: number | null;
  pickupProduct?: boolean | null;
  point?: string | null;
  price?: number | null;
  reservationDay?: string | null;
  reservationStartTime?: string | null;
  reservationStatus?: string | null;
  reservationTime?: number | null;
  reserveId?: number | null;
  storageId?: number | null;
  tel?: string | null;
  tossPrivateKey?: string | null;
  type?: number | null;
  updateAt?: string | null;
  pwd?: string | null;
};

export type DashboardItem = {
  id: number;
  reserveId: number | null;

  customerName: string;
  tel: string;
  os: string;
  password: string;

  reservationStatus: string;
  reservationDay: string;
  reservationStartTime: string;
  reservationTime: number;

  price: number;
  addPay: number;

  memo: string;
  ordId: string;

  raw: ReserveUserItem;
};

export type ReserveUserDetailItem = {
  addPay?: number | null;
  addPayOrdId?: string | null;
  addPayTof?: boolean | null;
  addPayType?: number | null;
  createdAt?: string | null;
  id: number;
  mberNm?: string | null;
  mberNo?: number | null;
  memo?: string | null;
  ordId?: string | null;
  os?: string | null;
  payType?: number | null;
  pickupProduct?: boolean | null;
  point?: string | null;
  price?: number | null;
  reservationDay?: string | null;
  reservationStartTime?: string | null;
  reservationStatus?: string | null;
  reservationTime?: number | null;
  reserveId?: number | null;
  storageId?: number | null;
  tel?: string | null;
  tossPrivateKey?: string | null;
  type?: number | null;
  updateAt?: string | null;
  pwd?: string | null;
};

export type DashboardStorageCounts = {
  cold: number;
  room: number;
  carrier: number;
  pickup: number;
};

export type ReserveUserResponse = {
  items: ReserveUserItem[];
  counts: DashboardStorageCounts;
};

export type DashboardSummary = {
  activeReservations: number;
  app: number;
  kiosk: number;
  pickup: number;
  cold: number;
  room: number;
  carrier: number;
};

export type PickupRequest = {
  historyIds: number[];
  point: string;
  reserveId: number;
};

export type CancelReserveRequest = {
  point: string;
  reserveId: number;
};

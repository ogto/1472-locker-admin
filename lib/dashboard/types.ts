export type ZoneKey = "all" | "app" | "kiosk";

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

export type DashboardSummary = {
  total: number;
  app: number;
  kiosk: number;
};
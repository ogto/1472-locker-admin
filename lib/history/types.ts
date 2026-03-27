export type HistoryItem = {
  addPay: number;
  addPayOrdId: string;
  addPayTof: boolean;
  addPayType: number;
  createdAt: string;
  id: number;
  mberNm: string;
  mberNo: number;
  memo: string;
  ordId: string;
  os: string;
  payType: number;
  pickupProduct: boolean;
  point: string;
  price: number;
  pwd: string;
  reservationDay: string;
  reservationStartTime: string;
  reservationStatus: string;
  reservationTime: number;
  reserveId: number;
  storageId: number | null;
  tel: string;
  tossPrivateKey: string;
  type: number | null;
  updateAt: string;
};

export type HistoryDetailItem = {
  addPay: number;
  addPayOrdId: string;
  addPayTof: boolean;
  addPayType: number;
  createdAt: string;
  id: number;
  mberNm: string;
  mberNo: number;
  memo: string;
  ordId: string;
  os: string;
  payType: number;
  pickupProduct: boolean;
  point: string;
  price: number;
  pwd: string;
  reservationDay: string;
  reservationStartTime: string;
  reservationStatus: string;
  reservationTime: number;
  reserveId: number;
  storageId: number | null;
  tel: string;
  tossPrivateKey: string;
  type: number | null;
  updateAt: string;
};

export type HistoryPageResponse = {
  content: HistoryItem[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
};

export type HistorySearchParams = {
  page: number;
  size: number;
  point?: string;
  reservationStartDay?: string;
  reservationEndDay?: string;
  searchQuery?: string;
  reservationStatus?: string;
};

export type HistorySummary = {
  reservationCount: number;
  storageCount: number;
  coldCount: number;
  roomCount: number;
  carrierCount: number;
  pickupCount: number;
  completedCount: number;
  pickupDoneCount: number;
  pendingCount: number;
  canceledCount: number;
};

export type HistoryFilterValue = {
  point: string;
  reservationStartDay: string;
  reservationEndDay: string;
  searchQuery: string;
  reservationStatus: string;
};

export type HistoryViewItem = {
  id: number;
  reserveId: number;
  customerName: string;
  tel: string;
  statusLabel: string;
  priceText: string;
  reservationDateText: string;
  raw: HistoryItem;
};

export type HistoryDetailViewItem = {
  id: number;
  reserveId: number;
  storageId: number | null;
  typeLabel: string;
  pointLabel: string;
  osLabel: string;
  statusLabel: string;
  priceText: string;
  addPayText: string;
  createdAtText: string;
  updateAtText: string;
  reservationDateText: string;
  pickupLabel: string;
  maskedPwd: string;
  memo: string;
  ordId: string;
};
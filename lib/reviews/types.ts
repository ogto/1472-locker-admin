export type ReviewEventStatus =
  | "REQUESTED"
  | "PROOF_SENT"
  | "REVIEW_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REWARDED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "DUPLICATED";

export type ReviewEvent = {
  id: number;
  reserveId: number;
  phone: string;
  point: string;
  lockerNumbers?: string | null;
  storageType?: string | null;
  useAmount: number;
  proofImageUrl?: string | null;
  screenshotUrl?: string | null;
  reviewText?: string | null;
  rewardType?: "CASH" | "COUPON" | string | null;
  rewardAmount: number;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  couponId?: number | null;
  status: ReviewEventStatus;
  duplicateFlags: string[];
  previousReviewEventRequestId?: number | null;
  reviewNote?: string | null;
  rejectReason?: string | null;
  createdAt?: string | null;
  proofSentAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rewardedAt?: string | null;
  paidAt?: string | null;
};

export type ReviewEventListResponse = {
  ok: boolean;
  items: ReviewEvent[];
  message?: string;
};

export type ReviewEventMutationResponse = {
  ok: boolean;
  event?: ReviewEvent;
  count?: number;
  message?: string;
};

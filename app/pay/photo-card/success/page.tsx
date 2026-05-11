import { Suspense } from "react";
import { PhotoCardPaymentSuccessClient } from "./photo-card-payment-success-client";

export default function PhotoCardPaymentSuccessPage() {
  return (
    <Suspense>
      <PhotoCardPaymentSuccessClient />
    </Suspense>
  );
}

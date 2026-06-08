import { NextRequest } from "next/server";
import { proxyReviewBotJson } from "@/lib/reviews/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams();

  const status = url.searchParams.get("status");
  const phone = url.searchParams.get("phone");

  if (status) searchParams.set("status", status);
  if (phone) searchParams.set("phone", phone);

  const query = searchParams.toString();

  return proxyReviewBotJson(
    req,
    `/api/admin/review-events${query ? `?${query}` : ""}`
  );
}

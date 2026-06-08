import { NextRequest } from "next/server";
import { proxyReviewBotJson } from "@/lib/reviews/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyReviewBotJson(req, `/api/admin/review-events/${id}/approve`, {
    method: "POST",
  });
}

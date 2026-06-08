import { NextRequest } from "next/server";
import { proxyReviewBotJson } from "@/lib/reviews/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.text();

  return proxyReviewBotJson(req, `/api/admin/review-events/${id}/duplicate`, {
    method: "POST",
    body,
  });
}

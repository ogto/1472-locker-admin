import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export async function GET(req: NextRequest) {
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = !!sessionToken && cookieValue === sessionToken;

  return NextResponse.json({
    ok: true,
    authenticated,
  });
}
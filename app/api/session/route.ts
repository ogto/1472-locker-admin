import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_ROLE_COOKIE_NAME,
} from "@/lib/admin/constants";

export async function GET(req: NextRequest) {
  const adminToken = process.env.ADMIN_SESSION_TOKEN;
  const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;

  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  const roleValue = req.cookies.get(ADMIN_ROLE_COOKIE_NAME)?.value ?? "";

  let authenticated = false;
  let role: "admin" | "super-admin" | null = null;

  if (
    roleValue === "super-admin" &&
    !!superAdminToken &&
    cookieValue === superAdminToken
  ) {
    authenticated = true;
    role = "super-admin";
  } else if (
    roleValue === "admin" &&
    !!adminToken &&
    cookieValue === adminToken
  ) {
    authenticated = true;
    role = "admin";
  }

  return NextResponse.json({
    ok: true,
    authenticated,
    role,
  });
}
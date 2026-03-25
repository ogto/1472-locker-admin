import { NextResponse } from "next/server";
import { CCTV_CAMERAS } from "@/lib/cctv/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: CCTV_CAMERAS,
  });
}
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export async function POST(req: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_SESSION_TOKEN;
    const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
    const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const allowedTokens = [adminToken, superAdminToken].filter(Boolean);

    if (!cookieValue || !allowedTokens.includes(cookieValue)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const url =
      "https://cloud.1472.ai:18443/api/v4/bread-storage/reserve-user?point=bank&reserveStatus=COMPLETED";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    const rawText = await response.text();

    let parsedData: unknown = null;

    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = null;
    }

    // 1) 백엔드가 { ok, data: { items, counts } } 구조로 주는 경우
    if (
      parsedData &&
      typeof parsedData === "object" &&
      !Array.isArray(parsedData) &&
      "data" in parsedData
    ) {
      const wrapped = parsedData as {
        ok?: boolean;
        data?: {
          items?: unknown;
          counts?: {
            cold?: unknown;
            room?: unknown;
            carrier?: unknown;
            pickup?: unknown;
          };
        };
        message?: string;
      };

      const wrappedItems = Array.isArray(wrapped.data?.items)
        ? wrapped.data.items
        : [];

      const wrappedCounts = wrapped.data?.counts ?? {};

      return NextResponse.json(
        {
          ok: response.ok,
          status: response.status,
          data: {
            items: wrappedItems,
            counts: {
              cold: Number(wrappedCounts.cold ?? 0),
              room: Number(wrappedCounts.room ?? 0),
              carrier: Number(wrappedCounts.carrier ?? 0),
              pickup: Number(wrappedCounts.pickup ?? 0),
            },
          },
        },
        { status: response.status }
      );
    }

    // 2) 백엔드가 { items, counts } 구조로 바로 주는 경우
    if (
      parsedData &&
      typeof parsedData === "object" &&
      !Array.isArray(parsedData) &&
      "items" in parsedData
    ) {
      const dataObj = parsedData as {
        items?: unknown;
        counts?: {
          cold?: unknown;
          room?: unknown;
          carrier?: unknown;
          pickup?: unknown;
        };
      };

      return NextResponse.json(
        {
          ok: response.ok,
          status: response.status,
          data: {
            items: Array.isArray(dataObj.items) ? dataObj.items : [],
            counts: {
              cold: Number(dataObj.counts?.cold ?? 0),
              room: Number(dataObj.counts?.room ?? 0),
              carrier: Number(dataObj.counts?.carrier ?? 0),
              pickup: Number(dataObj.counts?.pickup ?? 0),
            },
          },
        },
        { status: response.status }
      );
    }

    // 3) 백엔드가 예전처럼 배열만 주는 경우
    if (Array.isArray(parsedData)) {
      return NextResponse.json(
        {
          ok: response.ok,
          status: response.status,
          data: {
            items: parsedData,
            counts: {
              cold: 0,
              room: 0,
              carrier: 0,
              pickup: 0,
            },
          },
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        status: response.status,
        message: "이용중 사용자 응답 형식이 올바르지 않습니다.",
        rawText,
        data: {
          items: [],
          counts: {
            cold: 0,
            room: 0,
            carrier: 0,
            pickup: 0,
          },
        },
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "이용중 사용자 조회 실패",
        detail: error instanceof Error ? error.message : String(error),
        data: {
          items: [],
          counts: {
            cold: 0,
            room: 0,
            carrier: 0,
            pickup: 0,
          },
        },
      },
      { status: 500 }
    );
  }
}
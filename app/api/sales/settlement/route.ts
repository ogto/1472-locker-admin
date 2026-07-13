import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

type RawRecord = Record<string, unknown>;

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as RawRecord;
    if ("data" in record) return record.data as T;
    if ("result" in record) return record.result as T;
    if ("payload" in record) return record.payload as T;
  }
  return value as T;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`upstream ${response.status} (${new URL(url).pathname}): ${text.slice(0, 200)}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`upstream returned non-JSON (${new URL(url).pathname}): ${text.slice(0, 120)}`);
  }
}

function dateKey(value: unknown) {
  if (Array.isArray(value) && value.length >= 3) {
    return `${value[0]}-${String(value[1]).padStart(2, "0")}-${String(value[2]).padStart(2, "0")}`;
  }
  const match = String(value ?? "").match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? "";
}

function code(value: unknown) {
  return String(value ?? "").match(/\d+/)?.[0] ?? "";
}

function sumRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value as RawRecord).reduce<number>((sum, item) => sum + Number(item || 0), 0);
}

function monthRows(value: unknown) {
  const rows = unwrap<RawRecord[]>(value);
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const payment = Number(row.paymentAmount ?? sumRecord(row.paymentTypeAmount));
      const cancel = Number(row.cancelAmount ?? sumRecord(row.paymentTypeCancelAmount));
      const paymentCount = sumRecord(row.paymentTypeCount);
      const cancelCount = sumRecord(row.paymentTypeCancelCount);
      return {
        date: dateKey(row.createdAt),
        amount: Number(row.netAmount ?? payment - cancel),
        count: paymentCount - cancelCount || Number(row.baseCount || 0) + Number(row.addCount || 0),
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!Number.isInteger(year) || year < 2020 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ message: "올바른 year, month가 필요합니다." }, { status: 400 });
  }

  const end = new Date(Date.UTC(year, month, 0));
  const dates = Array.from({ length: end.getUTCDate() }, (_, index) =>
    `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
  );

  try {
    const monthParams = `year=${year}&month=${month}`;

    const [bankRaw, baseballRaw, photoRaw] = await Promise.all([
      fetchJson(`${API_BASE}/v4/sales-info/month?${monthParams}&point=bank`),
      fetchJson(`${API_BASE}/v4/sales-info/month?${monthParams}&point=baseball`),
      fetchJson(`${API_BASE}/v4/sales-info/photo-card/month?${monthParams}`, {
        headers: { Accept: "application/json, text/plain, */*" },
      }),
    ]);
    const dailyResults = await mapWithConcurrency(dates, 8, async (date) => ({
      date,
      data: unwrap<RawRecord>(await fetchJson(`${API_BASE}/v4/sales-info/daily?date=${date}&point=bank`)),
    }));

    const ledgerBase: Array<{ id: number; date: string; amount: number; type: "payment" | "cancel"; reserveId: number }> = [];
    for (const result of dailyResults) {
      const items = Array.isArray(result.data?.items) ? (result.data.items as RawRecord[]) : [];
      for (const item of items) {
        const reserveId = Number(item.storageId);
        const typeCode = code(item.type);
        const price = Math.abs(Number(item.price || 0));
        if (!Number.isInteger(reserveId) || price < 8000 || (typeCode !== "0" && typeCode !== "2")) continue;
        const canceled = typeCode === "2";
        ledgerBase.push({
          id: Number(item.id),
          date: result.date,
          amount: (canceled ? -1 : 1) * price,
          type: canceled ? "cancel" : "payment",
          reserveId,
        });
      }
    }

    const reserveIds = [...new Set(ledgerBase.map((row) => row.reserveId))];
    const detailPairs = await mapWithConcurrency(reserveIds, 12, async (reserveId) => {
      try {
        const details = await fetchJson(
          `${API_BASE}/v4/bread-storage/reserve-user-detail?id=${reserveId}&point=bank`,
          { method: "POST", headers: { Accept: "application/json, text/plain, */*" } },
        );
        return [reserveId, Array.isArray(details) ? (details as RawRecord[]) : []] as const;
      } catch {
        return [reserveId, [] as RawRecord[]] as const;
      }
    });
    const detailMap = new Map(detailPairs);

    const pickupLedger = ledgerBase.flatMap((row) => {
      const details = detailMap.get(row.reserveId) ?? [];
      if (!details.some((item) => item.pickupProduct === true)) return [];
      const detailTypes = details
        .map((item) => Number(item.type))
        .filter(Number.isInteger);
      const types = detailTypes.length ? detailTypes : [0];
      const category = types.includes(2) ? "carrier" : types.includes(1) ? "room" : "cold";
      const baseFee = types.reduce((sum, type) => sum + (type === 1 ? 4000 : 5000), 0) || 5000;
      return [{ ...row, category, storageFee: row.type === "cancel" ? -baseFee : baseFee }];
    });

    const pickupMap = new Map<string, RawRecord>();
    for (const row of pickupLedger) {
      const daily = pickupMap.get(row.date) ?? {
        date: row.date,
        amount: 0,
        count: 0,
        storageFee: 0,
        coldCount: 0,
        coldAmount: 0,
        roomCount: 0,
        roomAmount: 0,
        carrierCount: 0,
        carrierAmount: 0,
      };
      const sign = row.type === "cancel" ? -1 : 1;
      daily.amount = Number(daily.amount) + row.amount;
      daily.count = Number(daily.count) + sign;
      daily.storageFee = Number(daily.storageFee) + row.storageFee;
      daily[`${row.category}Count`] = Number(daily[`${row.category}Count`]) + sign;
      daily[`${row.category}Amount`] = Number(daily[`${row.category}Amount`]) + row.amount;
      pickupMap.set(row.date, daily);
    }

    const photo = unwrap<RawRecord>(photoRaw) ?? {};
    const photoDaily = Array.isArray(photo.daily) ? (photo.daily as RawRecord[]) : [];

    return NextResponse.json({
      year,
      month,
      bank: monthRows(bankRaw),
      baseball: monthRows(baseballRaw),
      photoCard: photoDaily
        .map((row) => ({
          date: dateKey(row.date),
          amount: Number(row.cardAmount ?? row.totalAmount ?? 0),
          count: Number(row.count || 0),
        }))
        .filter((row) => row.date)
        .sort((a, b) => a.date.localeCompare(b.date)),
      pickupDaily: [...pickupMap.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))),
      pickupLedger: pickupLedger.map((row) => ({
        id: row.id,
        date: row.date,
        amount: row.amount,
        type: row.type,
        reserveId: row.reserveId,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "월 정산 데이터를 생성하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

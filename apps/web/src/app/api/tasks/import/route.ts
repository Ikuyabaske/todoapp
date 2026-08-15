import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@upkeep/db";
import { parseDateOnly } from "@upkeep/core";
import { requireUserId } from "@/server/session";
import { handleApiError } from "@/server/api-error";
import { taskInputSchema } from "@/server/validation/task";
import { parseTaskCsvRows } from "@/lib/csv";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TRUE_VALUES = new Set(["true", "1", "yes", "有効", "はい", "on"]);

function parseBoolean(value: string): boolean {
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

interface ImportError {
  row: number;
  name: string;
  error: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const text = await request.text();
    const rows = parseTaskCsvRows(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSVにデータ行がありません" }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: "一度にインポートできるのは500行までです" }, { status: 400 });
    }

    const categoryCache = new Map<string, string>();
    const errors: ImportError[] = [];
    let imported = 0;

    for (const [i, raw] of rows.entries()) {
      const rowNumber = i + 2; // ヘッダー行を1行目として数えた実際のCSV行番号

      try {
        const payload = {
          name: raw.name ?? "",
          categoryId: null as string | null,
          repeatUnit: raw.repeatUnit,
          repeatInterval: Number(raw.repeatInterval),
          firstDueAt: raw.firstDueAt,
          notificationEnabled: parseBoolean(raw.notificationEnabled ?? ""),
          notificationTime: raw.notificationTime,
          preNotificationDays: Number(raw.preNotificationDays),
          priority: raw.priority,
          memo: raw.memo || null,
        };

        const categoryName = (raw.category ?? "").trim();
        if (categoryName) {
          const cacheKey = categoryName;
          let categoryId = categoryCache.get(cacheKey);
          if (!categoryId) {
            const category = await prisma.category.upsert({
              where: { userId_name: { userId, name: categoryName } },
              update: {},
              create: { userId, name: categoryName },
            });
            categoryId = category.id;
            categoryCache.set(cacheKey, categoryId);
          }
          payload.categoryId = categoryId;
        }

        const body = taskInputSchema.parse(payload);
        const firstDueAt = parseDateOnly(body.firstDueAt);

        const nextDueAtStr = raw.nextDueAt;
        const nextDueAt = nextDueAtStr && DATE_ONLY_RE.test(nextDueAtStr) ? parseDateOnly(nextDueAtStr) : firstDueAt;

        const lastCompletedAtStr = raw.lastCompletedAt;
        const lastCompletedAt =
          lastCompletedAtStr && DATE_ONLY_RE.test(lastCompletedAtStr) ? parseDateOnly(lastCompletedAtStr) : null;

        await prisma.task.create({
          data: {
            userId,
            name: body.name,
            categoryId: body.categoryId ?? null,
            repeatUnit: body.repeatUnit,
            repeatInterval: body.repeatInterval,
            firstDueAt,
            nextDueAt,
            lastCompletedAt,
            notificationEnabled: body.notificationEnabled,
            notificationTime: body.notificationTime,
            preNotificationDays: body.preNotificationDays,
            priority: body.priority,
            memo: body.memo ?? null,
          },
        });

        imported += 1;
      } catch (rowError) {
        const message =
          rowError instanceof ZodError
            ? rowError.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" / ")
            : rowError instanceof Error
              ? rowError.message
              : "不明なエラーです";
        errors.push({ row: rowNumber, name: raw.name ?? "", error: message });
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (error) {
    return handleApiError(error);
  }
}

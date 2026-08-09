import { z } from "zod";
import { SNOOZE_PRESETS } from "@upkeep/core";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で指定してください");

// completedAtを省略した場合はサーバー側で「今日(Asia/Tokyo)」を採用する。
export const completeTaskSchema = z.object({
  completedAt: dateOnlySchema.optional(),
  note: z.string().max(500, "500文字以内で入力してください").nullable().optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export const snoozeTaskSchema = z.object({
  preset: z.enum(SNOOZE_PRESETS),
  // preset="CUSTOM" のときのみ必須。datetime-local由来のローカル日時文字列。
  customUntil: z.string().min(1).optional(),
});

export type SnoozeTaskInput = z.infer<typeof snoozeTaskSchema>;

import { z } from "zod";

export const repeatUnitSchema = z.enum(["DAY", "WEEK", "MONTH", "YEAR"]);
export const prioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で指定してください");

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm形式で指定してください");

export const taskInputSchema = z.object({
  name: z.string().trim().min(1, "タスク名は必須です").max(100, "100文字以内で入力してください"),
  categoryId: z.string().min(1).nullable().optional(),
  repeatUnit: repeatUnitSchema,
  repeatInterval: z.number().int().min(1, "1以上を指定してください").max(365, "365以下を指定してください"),
  firstDueAt: dateOnlySchema,
  notificationEnabled: z.boolean(),
  notificationTime: timeSchema,
  preNotificationDays: z.number().int().min(0).max(30),
  priority: prioritySchema,
  memo: z.string().max(2000, "2000文字以内で入力してください").nullable().optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export const taskUpdateSchema = taskInputSchema.partial();
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

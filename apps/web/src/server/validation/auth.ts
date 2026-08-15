import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().max(50, "50文字以内で入力してください").optional(),
  email: z.string().trim().email("メールアドレスの形式が正しくありません").max(255),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(100),
  inviteCode: z.string().min(1, "招待コードを入力してください"),
});

export type SignupInput = z.infer<typeof signupSchema>;

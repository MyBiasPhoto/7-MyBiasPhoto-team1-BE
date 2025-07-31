import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: '이메일은 필수 입력 항목입니다.' })
    .email({ message: '유효한 이메일 형식이 아닙니다.' }),
  password: z.string().min(1, { message: '비밀번호는 필수 입력 항목입니다.' }),
});

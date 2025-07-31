import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: '이메일은 필수 입력 항목입니다.' })
      .email({ message: '유효한 이메일 형식이 아닙니다.' }),
    password: z
      .string()
      .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
      .regex(/[A-Za-z]/, {
        message: '비밀번호는 최소 1개 이상의 영문자를 포함해야 합니다.',
      })
      .regex(/[0-9]/, {
        message: '비밀번호는 최소 1개 이상의 숫자를 포함해야 합니다.',
      })
      .regex(/[^A-Za-z0-9]/, {
        message: '비밀번호는 최소 1개 이상의 특수문자를 포함해야 합니다.',
      }),
    confirmPassword: z.string().min(1, { message: '비밀번호 확인은 필수 입력 항목입니다.' }),
    nickname: z
      .string()
      .min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
      .max(10, { message: '닉네임은 최대 10자까지 가능합니다.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

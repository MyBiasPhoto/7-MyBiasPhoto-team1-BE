import { z } from 'zod';

export const getMyGroupedCards = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(5),
  search: z.string().default(''),
  grade: z.enum(['COMMON', 'RARE', 'SUPER RARE', 'LEGENDARY']).optional(),
  genre: z
    .enum([
      '앨범',
      '특전',
      '팬싸',
      '시즌그리팅',
      '팬미팅',
      '콘서트',
      'MD',
      '콜라보',
      '팬클럽',
      '기타',
    ])
    .optional(),
});

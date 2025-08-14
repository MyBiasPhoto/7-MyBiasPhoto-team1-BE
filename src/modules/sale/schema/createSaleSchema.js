import { z } from 'zod';

export const createSaleParamSchema = z.object({
  photoCardId: z.coerce.number().int().positive(),
});

export const createSaleBodySchema = z.object({
  price: z.coerce.number().int().min(0),
  initialQuantity: z.coerce.number().int().min(1),
  desiredGrade: z.enum(['COMMON', 'RARE', 'SUPER RARE', 'LEGENDARY']).optional().nullable(),
  desiredGenre: z
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
    .optional()
    .nullable(),
  desiredDesc: z.string().max(500).optional().nullable(),
});

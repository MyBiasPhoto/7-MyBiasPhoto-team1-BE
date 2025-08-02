import { z } from 'zod';

export const getSaleListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(9),
  search: z.string().default(''),
  orderBy: z.enum(['priceLowToHigh', 'priceHighToLow', 'newest', 'oldest']).default('newest'),
  grade: z.enum(['COMMON', 'RARE', 'SUPER RARE', 'LEGENDARY']).optional(),
  genre: z.enum(['IDOL', 'SPORTS', 'ART', 'OTHER']).optional(),
  soldOut: z.coerce.boolean().default(false),
});

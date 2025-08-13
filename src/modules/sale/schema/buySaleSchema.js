// src/modules/sale/schema/buySaleSchema.js
import { z } from 'zod';

export const buySaleSchema = z.object({
  quantity: z.coerce.number().int().positive().max(10).default(1),
});

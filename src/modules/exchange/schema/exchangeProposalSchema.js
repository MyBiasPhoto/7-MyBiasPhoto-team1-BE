import { z } from 'zod';

export const exchangeProposalSchema = z.object({
  proposedCardId: z.coerce.number().int().positive(),
  message: z.string().trim().min(1, '교환 제시 내용을 입력해 주세요.').max(500),
});

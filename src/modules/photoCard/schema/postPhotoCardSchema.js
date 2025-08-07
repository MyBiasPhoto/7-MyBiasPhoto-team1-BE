import { z } from 'zod';

export const postPhotoCardSchema = z.object({
  name: z.string().min(1, '포토카드 이름을 입력해 주세요'),
  description: z.string().min(1, '카드 설명을 입력해 주세요'),
  imageUrl: z.string().url('유효한 이미지 주소를 입력해 주세요.'),
  grade: z.enum(['COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY']),
  genre: z.enum([
    'ALBUM',
    'SPECIAL',
    'FANSIGN',
    'SEASON_GREETING',
    'FANMEETING',
    'CONCERT',
    'MD',
    'COLLAB',
    'FANCLUB',
    'ETC',
  ]),
  initialPrice: z.coerce.number().int().min(0, '0원 이상 입력해 주세요.'),
  totalQuantity: z.coerce.number().int().min(1, '1개 이상 입력해 주세요.'),
  creatorId: z.coerce.number().int().min(1, '유효한 userId를 입력해 주세요.'),
});

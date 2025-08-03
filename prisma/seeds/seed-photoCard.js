import { prisma } from '../../src/common/utils/prisma.js';
import { photoCardData } from '../data/photoCard.js';

export default async function seedPhotoCard(userIdMap) {
  const photoCardIdMap = new Map();

  for (let i = 0; i < photoCardData.length; i++) {
    const card = photoCardData[i];
    const creatorId = userIdMap.get(card.creatorId);

    if (!creatorId) {
      console.warn(`creatorId ${card.creatorId} not found`);
      continue;
    }

    const created = await prisma.photoCard.create({
      data: { ...card, creatorId },
    });

    photoCardIdMap.set(i + 1, created.id);
  }

  return photoCardIdMap;
}

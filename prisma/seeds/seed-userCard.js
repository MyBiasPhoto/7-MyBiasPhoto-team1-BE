import { prisma } from '../../src/common/utils/prisma.js';

export default async function seedUserCard(userIdMap, photoCardIdMap) {
  const userCardIdMap = new Map();
  let index = 1;

  for (const [cardIndex, photoCardId] of photoCardIdMap.entries()) {
    const creatorId = await prisma.photoCard
      .findUnique({ where: { id: photoCardId } })
      .then((card) => card.creatorId);

    const totalQuantity = await prisma.photoCard
      .findUnique({ where: { id: photoCardId } })
      .then((card) => card.totalQuantity);

    for (let i = 0; i < totalQuantity; i++) {
      const created = await prisma.userCard.create({
        data: {
          ownerId: creatorId,
          photoCardId,
          createdAt: new Date(Date.now() - i * 1000 * 60),
        },
      });

      userCardIdMap.set(index++, created.id);
    }
  }

  return userCardIdMap;
}

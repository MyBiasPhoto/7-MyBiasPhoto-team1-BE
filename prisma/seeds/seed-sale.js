import { prisma } from '../../src/common/utils/prisma.js';

export default async function seedSale(userIdMap, photoCardIdMap, userCardIdMap) {
  const targetSales = [];

  for (const [index, userCardId] of userCardIdMap.entries()) {
    if (index % 2 !== 0) continue;

    const userCard = await prisma.userCard.findUnique({
      where: { id: userCardId },
    });

    if (!userCard) {
      throw new Error(
        `userCard with id ${userCardId} not found. Check your userCardIdMap or previous seeding logic.`
      );
    }

    await prisma.userCard.update({
      where: { id: userCardId },
      data: { isOnSale: true },
    });

    targetSales.push({
      sellerId: userCard.ownerId,
      userCardId,
      photoCardId: userCard.photoCardId,
      price: 1500,
      desiredGrade: 'COMMON',
      desiredGenre: 'CONCERT',
      status: 'ON_SALE',
    });
  }

  if (targetSales.length === 0) {
    throw new Error('No sales were generated. Check your logic.');
  }

  await prisma.sale.createMany({ data: targetSales });
}

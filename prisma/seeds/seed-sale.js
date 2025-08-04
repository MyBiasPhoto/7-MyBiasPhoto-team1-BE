import { prisma } from '../../src/common/utils/prisma.js';
import { CardGrade, CardGenre, UserCardStatus } from '@prisma/client';

// 랜덤 Enum 값 가져오기
function getRandomEnumValue(enumeration) {
  const values = Object.values(enumeration);
  const index = Math.floor(Math.random() * values.length);
  return values[index];
}

export default async function seedSale() {
  const allPhotoCards = await prisma.photoCard.findMany({
    include: {
      userCards: true,
    },
  });

  for (let i = 0; i < allPhotoCards.length; i++) {
    if ((i + 1) % 2 !== 0) continue; // 짝수만

    const photoCard = allPhotoCards[i];
    const idleCards = photoCard.userCards.filter(
      (uc) => uc.ownerId === photoCard.creatorId && uc.status === 'IDLE'
    );

    if (idleCards.length === 0) continue; // 올릴 거 없음

    const saleQuantity = Math.min(2, idleCards.length);
    const desiredGrade = getRandomEnumValue(CardGrade);
    const desiredGenre = getRandomEnumValue(CardGenre);
    const desiredDesc = `${desiredGenre} 장르의 카드 중 ${desiredGrade} 등급이랑 교환 희망합니다`;

    const sale = await prisma.sale.create({
      data: {
        sellerId: photoCard.creatorId,
        photoCardId: photoCard.id,
        price: photoCard.initialPrice,
        initialQuantity: saleQuantity,
        quantity: saleQuantity,
        desiredGrade,
        desiredGenre,
        desiredDesc,
      },
    });

    const toUpdate = idleCards.slice(0, saleQuantity);
    for (const userCard of toUpdate) {
      await prisma.userCard.update({
        where: { id: userCard.id },
        data: { status: UserCardStatus.ON_SALE },
      });
    }
  }

  console.log('[seed-sale] 판매 등록 완료됨');
}

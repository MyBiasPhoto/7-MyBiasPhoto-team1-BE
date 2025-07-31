// prisma/seed.ts
import { PrismaClient, CardGrade, CardGenre } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. 유저 생성
  const users = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          nickname: `User${i}`,
          password: 'hashed-password',
          provider: 'LOCAL',
        },
      })
    )
  );

  // 2. 포토카드 생성 (각 유저마다 2개)
  const photoCards = await Promise.all(
    users.flatMap((user, i) =>
      Array.from({ length: 2 }).map((_, j) =>
        prisma.photoCard.create({
          data: {
            name: `Card${i}-${j}`,
            description: `카드 설명`,
            imageUrl: `https://placehold.co/600x400?text=Card${i}-${j}`,
            grade: CardGrade.NORMAL,
            genre: CardGenre.IDOL,
            initialPrice: 1000,
            totalQuantity: 3,
            createdById: user.id,
          },
        })
      )
    )
  );

  // 3. 유저카드 생성 (user[0]이 포토카드 0,1 소유)
  const userCards = await Promise.all(
    [0, 1].map((i) =>
      prisma.userCard.create({
        data: {
          userId: users[0].id,
          photoCardId: photoCards[i].id,
          isOnSale: true,
        },
      })
    )
  );

  // 4. 판매 등록 (user[0]의 userCard[0])
  const sale = await prisma.sale.create({
    data: {
      sellerId: users[0].id,
      userCardId: userCards[0].id,
      price: 1500,
      desiredGenre: CardGenre.IDOL,
      desiredGrade: CardGrade.RARE,
    },
  });

  // 5. 구매 등록 (user[1]이 구매자)
  await prisma.purchase.create({
    data: {
      buyerId: users[1].id,
      saleId: sale.id,
    },
  });

  // 6. 교환 제안 (user[2]이 제안)
  const proposerCard = await prisma.userCard.create({
    data: {
      userId: users[2].id,
      photoCardId: photoCards[3].id,
    },
  });

  await prisma.exchangeProposal.create({
    data: {
      saleId: sale.id,
      proposerId: users[2].id,
      proposedCardId: proposerCard.id,
    },
  });
}

main()
  .then(() => {
    console.log('관계형 시딩 완료');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('시딩 실패 : ', e);
    return prisma.$disconnect();
  });

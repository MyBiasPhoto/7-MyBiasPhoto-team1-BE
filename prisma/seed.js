import { prisma } from '../src/common/utils/prisma.js';
import { userData } from './data/user.js';
import { photoCardData } from './data/photoCard.js';

async function main() {
  await prisma.user.createMany({ data: userData });
  await prisma.photoCard.createMany({ data: photoCardData });

  // UserCard 생성: totalQuantity만큼 생성 + createdAt에 시간차 반영
  for (const card of photoCardData) {
    for (let i = 0; i < card.totalQuantity; i++) {
      await prisma.userCard.create({
        data: {
          ownerId: card.creatorId,
          photoCardId: card.id,
          createdAt: new Date(Date.now() - i * 1000 * 60),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1); // 오류 시 프로세스 종료
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

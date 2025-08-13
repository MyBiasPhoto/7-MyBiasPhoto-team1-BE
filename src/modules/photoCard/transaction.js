import { prisma } from '../../common/utils/prisma.js';

//월별 생성 제한 (환경변수 안 쓰고 고정값으로)
const MONTHLY_LIMIT = 35;

//현재 연/월 계산
function nowMY() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

class PhotoCardTransaction {
  constructor(photoCardRepository) {
    this.photoCardRepository = photoCardRepository;
  }

  async bumpMonthlyCreateOrThrow(tx, userId) {
    const { month, year } = nowMY();

    const rec = await tx.cardCreationLimit.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    if (!rec) {
      await tx.cardCreationLimit.create({
        data: { userId, month, year, created: 1 },
      });
      return 1;
    }

    if (rec.created >= MONTHLY_LIMIT) {
      const err = new Error(`이번 달 생성 한도(${MONTHLY_LIMIT})를 초과했습니다.`);
      err.status = 409;
      throw err;
    }

    const newCount = rec.created + 1;
    await tx.cardCreationLimit.update({
      where: { id: rec.id },
      data: { created: { increment: 1 } },
    });
    return newCount;
  }

  async createPhotoCardInTransaction(data, userId) {
    const { name, description, imageUrl, grade, genre, initialPrice, totalQuantity } = data;

    return await prisma.$transaction(async (tx) => {
      const newCount = await this.bumpMonthlyCreateOrThrow(tx, userId);

      const photoCard = await this.photoCardRepository.createPhotoCard(tx, {
        name,
        description,
        imageUrl,
        grade,
        genre,
        initialPrice,
        totalQuantity,
        creator: { connect: { id: userId } },
      });

      const userCards = await this.photoCardRepository.createUserCards(
        tx,
        Array.from({ length: totalQuantity }).map(() => ({
          ownerId: userId,
          photoCardId: photoCard.id,
        }))
      );

      return {
        photoCard,
        userCards,
        monthly: {
          created: newCount,
          remaining: Math.max(MONTHLY_LIMIT - newCount, 0),
          limit: MONTHLY_LIMIT,
        },
      };
    });
  }
}

export default PhotoCardTransaction;

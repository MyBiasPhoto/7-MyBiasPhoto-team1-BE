import { prisma } from '../../common/utils/prisma.js';
import { CARD_GRADE_VALUES } from '../../common/constants/enum.js';

class UserCardRepository {
  findUserById = async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  };

  getUserCardList = async ({ where, orderBy, skip, take, include }) => {
    const userCard = await prisma.userCard.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
    return userCard;
  };

  getTotalCount = async ({ where }) => {
    const totalCount = await prisma.userCard.count({ where });
    return totalCount;
  };

  // Promise All 로 처리할경우
  getGradeCount = async ({ ownerId, status, grade }) => {
    const gradeCount = prisma.userCard.count({
      where: {
        ownerId,
        status,
        photoCard: {
          grade,
        },
      },
    });
    return gradeCount;
  };

  // 트랜잭션으로 처리했을 경우
  getGalleryDataInTransaction = async ({ where, orderBy, skip, take, include, userId }) => {
    const gradeValues = CARD_GRADE_VALUES;

    return prisma.$transaction(async (tx) => {
      const myGalleryListPromise = tx.userCard.findMany({ where, orderBy, skip, take, include });
      const totalCountPromise = tx.userCard.count({ where });

      const gradeCountPromises = gradeValues.map((grade) =>
        tx.userCard.count({
          where: { ownerId: userId, status: 'IDLE', photoCard: { grade } },
        })
      );

      const [myGalleryList, totalCount, ...gradeCounts] = await Promise.all([
        myGalleryListPromise,
        totalCountPromise,
        ...gradeCountPromises,
      ]);

      const gradeCountMap = gradeValues.reduce((acc, grade, idx) => {
        acc[grade] = gradeCounts[idx];
        return acc;
      }, {});

      return [myGalleryList, totalCount, gradeCountMap];
    });
  };
}

export default UserCardRepository;

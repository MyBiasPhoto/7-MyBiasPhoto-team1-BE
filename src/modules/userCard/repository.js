import { prisma } from '../../common/utils/prisma.js';

class UserCardRepository {
  getUserCardList = async ({ where, orderBy, skip, take, include }, client = prisma) => {
    const userCard = await client.userCard.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
    return userCard;
  };

  getTotalCount = async ({ where }, client = prisma) => {
    const totalCount = await client.userCard.count({ where });
    return totalCount;
  };

  // Promise All 로 처리할경우
  getGradeCount = async ({ ownerId, status, grade }, client = prisma) => {
    const gradeCount = client.userCard.count({
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

  getGradeCounts = async ({ ownerId }, client = prisma) => {
    const gradeCounts = await client.$queryRaw`
      SELECT pc.grade, COUNT(*)::int AS count
      FROM "UserCard" uc
      JOIN "PhotoCard" pc ON uc."photoCardId" = pc.id
      WHERE uc."ownerId" = ${ownerId}
        AND uc.status IN ('ON_SALE', 'PROPOSED')
      GROUP BY pc.grade
    `;

    return gradeCounts;
  };
}

export default UserCardRepository;

import { prisma } from '../../common/utils/prisma.js';
import { Prisma } from '@prisma/client';
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

  getGradeCounts = async ({ ownerId, statuses }, client = prisma) => {
    const statusArraySql = Prisma.sql`
    ARRAY[${Prisma.join(statuses)}]::"UserCardStatus"[]
  `;

    const rows = await client.$queryRaw(
      Prisma.sql`
        SELECT pc.grade, COUNT(*)::int AS count
        FROM "UserCard" uc
        JOIN "PhotoCard" pc ON uc."photoCardId" = pc.id
        WHERE uc."ownerId" = ${ownerId}
          AND uc.status = ANY(${statusArraySql})
        GROUP BY pc.grade
      `
    );

    return rows;
  };
}

export default UserCardRepository;

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

  getGroupedByPhoto = async (
    { userId, limit, offset, search, mappedGrade, mappedGenre },
    client = prisma
  ) => {
    return client.$queryRaw(Prisma.sql`
  WITH base AS (
    SELECT
      uc."photoCardId",
      uc."createdAt",
      pc.name,
      pc."imageUrl",
      pc.grade,
      pc.genre
    FROM "UserCard" uc
    JOIN "PhotoCard" pc ON pc.id = uc."photoCardId"
    WHERE uc."ownerId" = ${userId}
      AND uc.status = 'IDLE'
      AND (${search}::text IS NULL OR pc.name ILIKE '%' || ${search} || '%')
      AND (${mappedGrade}::text IS NULL OR ${mappedGrade}::text = ''
        OR pc.grade = ${Prisma.sql`${mappedGrade}::"CardGrade"`})
      AND (${mappedGenre}::text IS NULL OR ${mappedGenre}::text = ''
        OR pc.genre = ${Prisma.sql`${mappedGenre}::"CardGenre"`})
  )
  SELECT
    b."photoCardId",
    MIN(b.name)        AS "name",
    MIN(b."imageUrl")  AS "imageUrl",
    MIN(b.grade)       AS "grade",
    MIN(b.genre)       AS "genre",
    COUNT(*)::int      AS "ownedCount",
    MAX(b."createdAt") AS "recentAt"
  FROM base b
  GROUP BY b."photoCardId"
  ORDER BY "ownedCount" DESC, "photoCardId" DESC
  OFFSET ${offset}
  LIMIT ${limit};
    `);
  };

  /**
   * 그룹 총 개수: 동일 필터로 DISTINCT photoCardId 카운트
   */
  countGroupedByPhoto = async ({ userId, search, mappedGrade, mappedGenre }, client = prisma) => {
    const rows = await client.$queryRaw(Prisma.sql`
  WITH base AS (
    SELECT uc."ownerId", uc."photoCardId"
    FROM "UserCard" uc
    JOIN "PhotoCard" pc ON pc.id = uc."photoCardId"
    WHERE uc."ownerId" = ${userId}
      AND uc.status = 'IDLE'
      AND (${search}::text IS NULL OR pc.name ILIKE '%' || ${search} || '%')
      AND (${mappedGrade}::text IS NULL OR ${mappedGrade}::text = ''
        OR pc.grade = ${Prisma.sql`${mappedGrade}::"CardGrade"`})
      AND (${mappedGenre}::text IS NULL OR ${mappedGenre}::text = ''
        OR pc.genre = ${Prisma.sql`${mappedGenre}::"CardGenre"`})
  )
  SELECT COUNT(*)::int AS total
  FROM (
    SELECT DISTINCT b."photoCardId" FROM base b
  ) d;
    `);
    return Number(rows?.[0]?.total ?? 0);
  };
}

export default UserCardRepository;

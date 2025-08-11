// src/modules/sale/repository.js
import { prisma } from '../../common/utils/prisma.js';

class SaleRepository {
  getSaleList = async ({ where, orderByClause, include, skip, take }) => {
    const sales = await prisma.sale.findMany({
      where,
      orderBy: orderByClause || { createdAt: 'desc' },
      skip,
      take,
      include,
    });
    return sales;
  };

  getTotalCount = async ({ where }) => {
    const totalCount = await prisma.sale.count({ where });
    return totalCount;
  };
  //   return { saleList, totalCount };
  // }
  getOnSaleCountsByGrade = async () => {
    const rows = await prisma.$queryRaw`
    SELECT "photoCard"."grade" AS grade, COUNT(*)::int AS count
      FROM "Sale" s
      JOIN "PhotoCard" "photoCard" ON "photoCard"."id" = s."photoCardId"
      WHERE s."quantity" > 0 AND s."deletedAt" IS NULL
      GROUP BY "photoCard"."grade"
      `;

    return rows;
  };

  async getSaleCardById(id) {
    const saleCard = await prisma.sale.findUnique({
      where: { id },
      include: {
        photoCard: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            grade: true,
            genre: true,
            initialPrice: true,
            totalQuantity: true,
          },
        },
        seller: {
          select: {
            nickname: true,
          },
        },
        proposals: {
          select: {
            id: true,
            proposedCardId: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            proposer: {
              select: {
                id: true,
                nickname: true,
              },
            },
            proposedCard: {
              select: {
                id: true,
                status: true,
                photoCard: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    grade: true,
                    genre: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return saleCard;
  }

  async patchSaleCardById(id, patchData) {
    console.log('레포에서id', id);
    const check = await prisma.sale.findUnique({
      where: { id },
    });

    if (!check) {
      throw new Error('존재하지않는 카드입니다.');
    }

    const patchCard = await prisma.sale.update({
      where: { id },
      data: patchData,
    });
    return patchCard;
  }

  async patchSaleListById(id, deletedAt) {
    const patch = await prisma.sale.update({
      where: { id },
      data: deletedAt,
    });
    return patch;
  }
  getSaleById = async (id) => {
    return await prisma.sale.findUnique({
      where: { id },
    });
  };

  getUserById = async (id) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  };

  executeBuySaleTx = async (txArgs) => {
    const { executeBuySaleTx } = await import('./transaction.js');
    // import 해서 똑 때오는게 아니라서 class 형으로 작성하여 서로가 서로를 의존하는 수가 생김
    // 의존성 순환 (Circular Dependency)발생할때 await import 걸어서 회피
    //   SaleRepository → transaction.js
    // transaction.js → 또다시 SaleRepository 참조할 경우
    return await executeBuySaleTx(txArgs);
  };
}

export default SaleRepository;

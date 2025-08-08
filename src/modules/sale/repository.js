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
}

export default SaleRepository;

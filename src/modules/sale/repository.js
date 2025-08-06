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
      },
    });
    return saleCard;
  }
}

export default SaleRepository;

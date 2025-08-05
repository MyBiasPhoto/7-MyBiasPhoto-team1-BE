import { prisma } from '../../common/utils/prisma.js';

class SaleRepository {
  async getSaleListAndTotalCount({ where, orderByClause, skip, take }) {
    const [saleList, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: orderByClause || { createdAt: 'desc' },
        skip,
        take,
        include: {
          photoCard: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              grade: true,
              genre: true,
            },
          },
          seller: {
            select: {
              nickname: true,
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { saleList, totalCount };
  }
}

export default SaleRepository;

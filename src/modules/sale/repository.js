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
}

export default SaleRepository;

import { prisma } from '../../common/utils/prisma.js';

class SaleRepository {
  async getSaleListAndTotalCount({ where, orderByClause, skip, take }) {
    const [saleList, totalCount] = await Promise.all([
      prisma.saleMarketSummary.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take,
      }),
      prisma.saleMarketSummary.count({ where }),
    ]);

    return { saleList, totalCount };
  }
}

export default SaleRepository;

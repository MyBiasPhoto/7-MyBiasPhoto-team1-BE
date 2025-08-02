class SaleService {
  constructor(saleRepository) {
    this.saleRepository = saleRepository;
  }

  getSaleList = async (query) => {
    const { page, pageSize, search, orderBy, grade, genre, soldOut } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      ...(grade && { grade }),
      ...(genre && { genre }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
      ...(soldOut ? {} : { totalOnSale: { gt: 0 } }), // on sale만 필터링
    };

    const orderByClause = {
      priceLowToHigh: { price: 'asc' },
      priceHighToLow: { price: 'desc' },
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
    }[orderBy];

    const { saleList, totalCount } = await this.saleRepository.getSaleListAndTotalCount({
      where,
      orderByClause,
      skip,
      take,
    });

    return {
      saleList,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  };
}
export default SaleService;

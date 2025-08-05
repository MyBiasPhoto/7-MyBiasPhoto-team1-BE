import {
  genreMap,
  gradeMap,
  genreMapReverse,
  gradeMapReverse,
} from '../../common/constants/enum.js';

class SaleService {
  constructor(saleRepository) {
    this.saleRepository = saleRepository;
  }

  getSaleList = async (query) => {
    const { page, pageSize, search, orderBy, grade, genre, includeSoldOut } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const mappedGrade = grade ? gradeMap[grade] : undefined;
    const mappedGenre = genre ? genreMap[genre] : undefined;

    const where = {
      AND: [
        ...(includeSoldOut === 'false' ? [{ quantity: { gt: 0 } }] : []),
        {
          photoCard: {
            is: {
              ...(mappedGrade && { grade: mappedGrade }),
              ...(mappedGenre && { genre: mappedGenre }),
              ...(search && {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              }),
            },
          },
        },
      ],
    };

    const orderByClause = {
      priceLowToHigh: { price: 'asc' },
      priceHighToLow: { price: 'desc' },
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
    }[orderBy];

    const include = {
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
        select: { nickname: true },
      },
    };

    const [saleList, totalCount] = await Promise.all([
      this.saleRepository.getSaleList({ where, orderByClause, include, skip, take }),
      this.saleRepository.getTotalCount({ where }),
    ]);

    // console.log('saleList: ', saleList);
    // console.log('totalCount: ', totalCount);

    const formattedSales = saleList.map((sale) => ({
      saleId: sale.id,
      name: sale.photoCard.name,
      imageUrl: sale.photoCard.imageUrl,
      grade: gradeMapReverse[sale.photoCard.grade] || sale.photoCard.grade,
      genre: genreMapReverse[sale.photoCard.genre] || sale.photoCard.genre,
      price: sale.price,
      initialQuantity: sale.initialQuantity,
      quantity: sale.quantity,
      isSoldOut: sale.quantity <= 0,
      sellerNickname: sale.seller.nickname,
    }));

    return {
      sales: formattedSales,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  };
}
export default SaleService;

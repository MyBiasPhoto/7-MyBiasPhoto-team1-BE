// src/modules/sale/service.js
import {
  genreMap,
  gradeMap,
  genreMapReverse,
  gradeMapReverse,
} from '../../common/constants/enum.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';
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
        ...(includeSoldOut === 'true' ? [{ quantity: { equals: 0 } }] : []),
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
        { deletedAt: null },
      ],
    };
    //con
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
  getSaleCardById = async (id) => {
    const cardById = await this.saleRepository.getSaleCardById(Number(id));
    return cardById;
  };

  patchSaleCardById = async (id, patchData) => {
    console.log('서비스에서', id);
    const card = await this.saleRepository.patchSaleCardById(Number(id), patchData);
    return card;
  };

  patchSaleListById = async (id, deletedAt) => {
    const card = await this.saleRepository.patchSaleListById(Number(id), deletedAt);
    return card;
  };
  buySale = async (userId, saleId, quantity) => {
    // 1. 사전 검증 (판매 존재 여부, 수량, 포인트 등)
    const sale = await this.saleRepository.getSaleById(saleId);
    if (!sale) {
      throwApiError('SALE_NOT_FOUND', '해당 판매글이 존재하지 않습니다.', 404);
    }

    if (sale.quantity < quantity) {
      throwApiError(
        'INSUFFICIENT_QUANTITY_CONFLICT',
        `요청한 수량(${quantity})이 남은 수량(${sale.quantity})보다 많습니다.`,
        409
      );
    }

    const buyer = await this.saleRepository.getUserById(userId);
    const totalPrice = sale.price * quantity;
    if (buyer.points < totalPrice) {
      throwApiError(
        'NOT_ENOUGH_MINERALS(POINTS)',
        `포인트가 부족합니다. 필요한 포인트: ${totalPrice}, 현재 보유 포인트: ${buyer.points}`,
        400
      );
    }

    // 2. 트랜잭션 실행 (판매자 포인트 증가, 구매자 포인트 차감 등)
    const result = await this.saleRepository.executeBuySaleTx({
      userId,
      sale,
      buyer,
      quantity,
      totalPrice,
    });

    return result;
  };
}
export default SaleService;

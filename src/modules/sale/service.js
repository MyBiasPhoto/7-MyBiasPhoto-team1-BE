// src/modules/sale/service.js
import {
  genreMap,
  gradeMap,
  genreMapReverse,
  gradeMapReverse,
  CARD_GRADE_VALUES,
} from '../../common/constants/enum.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';
class SaleService {
  constructor(
    saleRepository,
    notificationService,
    photoCardRepository,
    userRepository,
    userCardRepository,
    saleTransaction
  ) {
    this.saleRepository = saleRepository;
    this.notificationService = notificationService; // SSE 퍼블리셔 주입
    this.photoCardRepository = photoCardRepository;
    if (!this.notificationService) {
      // 새로 만들지 말고, 주입 누락을 바로 알리자 (SSE 인스턴스 공유 필수)
      throw new Error('NotificationService instance must be injected into SaleService');
    }
    this.userRepository = userRepository;
    this.userCardRepository = userCardRepository;
    this.saleTransaction = saleTransaction;
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
        //true일때 품절만 보이고 있음
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
          totalQuantity: true,
        },
      },
      seller: {
        select: { nickname: true },
      },
    };

    const [saleList, totalCount, gradeCounts] = await Promise.all([
      this.saleRepository.getSaleList({ where, orderByClause, include, skip, take }),
      this.saleRepository.getTotalCount({ where }),
      this.saleRepository.getOnSaleCountsByGrade(),
    ]);

    // console.log('saleList: ', saleList);
    // console.log('totalCount: ', totalCount);
    // console.log(gradeCounts);

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
      totalQuantity: sale.photoCard.totalQuantity,
    }));

    const by = Object.fromEntries(gradeCounts.map(({ grade, count }) => [grade, count]));
    const formattedGradeCounts = CARD_GRADE_VALUES.map((g) => ({
      grade: gradeMapReverse[g] ?? g,
      count: by[g] ?? 0,
    }));

    return {
      sales: formattedSales,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      gradeCounts: formattedGradeCounts,
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

  /**
   * 1. 사전 검증 - 판매 존재 여부, 수량, 포인트 등
   * 2. 트랜잭션 - 재고 감소, 포인트 차감/증가, 소유권 이전, 로그/구매기록, 알림 row 생성
   * 3. 트랜잭션 커밋 이후 알림퍼블리시 - 퍼블리시가 실패해도 거래를 되돌리지 않도록 트랜잭션 외부에서 실행
   *  **/

  buySale = async (userId, saleId, quantity) => {
    // 1. 사전 검증 (판매 존재 여부, 수량, 포인트 등)
    const sale = await this.saleRepository.getSaleById(saleId);
    if (!sale) {
      throwApiError('SALE_NOT_FOUND', '해당 판매글이 존재하지 않습니다.', 404);
    }

    if (sale.sellerId === userId) {
      throwApiError('CANNOT_BUY_MY_SALE', '본인 판매글은 구매할 수 없습니다.', 400);
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
        'NOT_ENOUGH_MINERALS',
        `포인트가 부족합니다. 필요한 포인트: ${totalPrice}, 현재 보유 포인트: ${buyer.points}`,
        400
      );
    }

    // 2. 트랜잭션 실행 (판매자 포인트 증가, 구매자 포인트 차감 등)
    const {
      purchaseIds,
      notificationIds = [],
      soldOut = false,
    } = await this.saleRepository.executeBuySaleTx({
      userId,
      sale,
      buyer,
      quantity,
      totalPrice,
    });

    // 3. 커밋 이후에만 SSE 퍼블리시 (실패해도 거래는 유지)
    if (this.notificationService && notificationIds.length > 0) {
      try {
        await this.notificationService.publishMany(notificationIds);
      } catch (err) {
        // 네트워크 이슈 등으로 푸시는 실패할 수 있음 → 로그만 남기고 무시(백필/목록으로 복구 가능)
        console.error('[notifications] publishMany failed:', err);
      }
    }

    // 4. 서비스 반환(컨트롤러에서 success/message/data 포맷으로 감싸서 응답)
    return { purchaseIds, soldOut };
  };

  createSale = async ({
    photoCardId,
    price,
    initialQuantity,
    desiredGrade,
    desiredGenre,
    desiredDesc,
    userId,
  }) => {
    const existingPhotoCard = await this.photoCardRepository.findPhotoCardById(photoCardId);
    if (!existingPhotoCard) {
      throwApiError('PHOTO_CARD_NOT_FOUND', `존재하지 않는 포토카드입니다.`, 404);
    }

    const existingUser = await this.userRepository.findUserById(userId);
    if (!existingUser) {
      throwApiError('USER_NOT_FOUND', `존재하지 않는 유저입니다.`, 404);
    }

    const newSale = await this.saleTransaction.excuteCreateSale({
      photoCardId,
      price,
      initialQuantity,
      desiredGrade,
      desiredGenre,
      desiredDesc,
      userId,
    });

    return newSale;
  };
}
export default SaleService;

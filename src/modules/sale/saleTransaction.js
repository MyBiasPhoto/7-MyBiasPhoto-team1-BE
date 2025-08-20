import { gradeMap, genreMap } from '../../common/constants/enum.js';
import { prisma } from '../../common/utils/prisma.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';
class SaleTransaction {
  constructor(saleRepository, userCardRepository) {
    this.saleRepository = saleRepository;
    this.userCardRepository = userCardRepository;
  }

  excuteCreateSale = async ({
    photoCardId,
    price,
    initialQuantity,
    desiredGrade,
    desiredGenre,
    desiredDesc,
    userId,
  }) => {
    return prisma.$transaction(async (tx) => {
      const saleCards = await this.userCardRepository.updateCardStatus(
        {
          ownerId: userId,
          photoCardId,
          fromStatus: 'IDLE',
          toStatus: 'ON_SALE',
          take: initialQuantity,
        },
        tx
      );

      if (saleCards.length < initialQuantity) {
        throwApiError(
          'INSUFFICIENT_AVAILABLE_STOCK',
          `판매 요청 수량(${initialQuantity})이 보유 수량(${saleCards.length})을 초과합니다.`,
          409
        );
      }

      const mappedDesiredGrade = desiredGrade ? gradeMap[desiredGrade] : undefined;
      const mappedDesiredGenre = desiredGenre ? genreMap[desiredGenre] : undefined;

      const sale = await this.saleRepository.createSale(
        {
          sellerId: userId,
          photoCardId,
          price,
          initialQuantity,
          quantity: initialQuantity,
          desiredGrade: mappedDesiredGrade ?? null,
          desiredGenre: mappedDesiredGenre ?? null,
          desiredDesc: desiredDesc ?? null,
        },
        tx
      );

      return sale;
    });
  };

  cancelSaleTx = async ({ sale, id, userId, deletedAt }) => {
    return prisma.$transaction(async (tx) => {
      const rows = await this.userCardRepository.updateCardStatus(
        {
          ownerId: userId,
          photoCardId: sale.photoCardId,
          fromStatus: 'ON_SALE',
          toStatus: 'IDLE',
          take: sale.quantity,
        },
        tx
      );

      const deletedSale = await this.saleRepository.patchSaleListById(Number(id), deletedAt);
      return { deletedCount: rows.length, deletedSale };
    });
  };
}

export default SaleTransaction;

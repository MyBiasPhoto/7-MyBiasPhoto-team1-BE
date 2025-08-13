// src/modules/sale/transaction.js

import { prisma } from '../../common/utils/prisma.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

export const executeBuySaleTx = async ({ userId, sale, buyer, quantity, totalPrice, repo }) => {
  // NOTE: repo는 SaleRepository 인스턴스 (service -> repository.executeBuySaleTx -> 여기로 전달)
  return await prisma.$transaction(
    async (tx) => {
      const saleId = sale.id;
      const sellerId = sale.sellerId;

      // 1. 판매자 보유 userCards중 ON_SALE 카드 확보
      const userCards = await repo.getUserCardsForSale(
        { photoCardId: sale.photoCardId, sellerId, take: quantity },
        tx
      );
      if (userCards.length < quantity) {
        throwApiError(
          'INSUFFICIENT_USERCARDS_CONFLICT',
          `요청 ${quantity}, 가능 ${userCards.length}`,
          409
        );
      }

      const purchaseIds = [];
      // 2. 카드 소유권 이전 + purchase생성
      for (const uc of userCards) {
        const { count: moved } = await repo.transferUserCardIfOnSale(
          { userCardId: uc.id, sellerId, buyerId: userId },
          tx
        );
        if (moved !== 1) {
          throwApiError(
            'USERCARD_ALREADY_TAKEN_CONFLICT',
            '다른 구매에 의해 이미 소유권이 변경되어 충돌이 일어났습니다.',
            409
          );
        }

        const purchase = await repo.createPurchase(
          { buyerId: userId, saleId, userCardId: uc.id },
          tx
        );
        purchaseIds.push(purchase.id);
      }

      // 3. 재고 수량 감소(필요 시 expectedPrice로 가격 보호)
      const { count } = await repo.decrementSaleQuantityIfEnough(
        { saleId, quantity, expectedPrice: sale.price },
        tx
      );
      if (count !== 1) {
        throwApiError(
          'INSUFFICIENT_QUANTITY_CONFLICT',
          '구매 처리 중 수량부족/가격 변경 이 확인되어 충돌 발생',
          409
        );
      }

      //3-1) 감소 후 잔여수량 확인 -품절여부판정
      const remaining = await repo.getSaleQuantity({ saleId }, tx);
      const soldOut = remaining === 0;

      // 4) 포인트 원자적 업데이트
      const { count: buyerUpdated } = await repo.decrementBuyerPointsIfEnough(
        { userId, amount: totalPrice },
        tx
      );
      if (buyerUpdated !== 1) {
        throwApiError('INSUFFICIENT_POINTS', '구매 처리 중 포인트 부족', 400);
      }
      await repo.incrementSellerPoints({ userId: sellerId, amount: totalPrice }, tx);

      // 5) 로그
      await repo.createPointLogs(
        { buyerId: userId, sellerId, amount: totalPrice, saleId, quantity },
        tx
      );

      // 6) 알림 생성 (구매, 품절)
      const notificationIds = [];
      const purchased = await repo.createPurchasedNotification(
        { sellerId, buyerNickname: buyer.nickname, saleId, quantity, amount: totalPrice },
        tx
      );
      notificationIds.push(purchased.id);

      if (soldOut) {
        const sold = await repo.createSoldOutNotification({ sellerId, saleId }, tx);
        notificationIds.push(sold.id);
      }

      return { purchaseIds, notificationIds, soldOut };
    },
    {
      timeout: 10_000,
      maxWait: 12_000,
    }
  );
};

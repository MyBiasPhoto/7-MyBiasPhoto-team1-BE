// src/modules/sale/transaction.js

import { prisma } from '../../common/utils/prisma.js';
import { UserCardStatus, PurchaseType, NotificationType } from '@prisma/client';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

export const executeBuySaleTx = async ({ userId, sale, buyer, quantity, totalPrice }) => {
  return await prisma.$transaction(
    async (tx) => {
      const saleId = sale.id;
      const sellerId = sale.sellerId;
      const price = sale.price;

      const userCards = await tx.userCard.findMany({
        where: {
          photoCardId: sale.photoCardId,
          ownerId: sellerId,
          status: UserCardStatus.ON_SALE,
        },
        orderBy: { createdAt: 'asc' },
        take: quantity,
      });

      if (userCards.length < quantity) {
        throwApiError(
          'INSUFFICIENT_USERCARDS_CONFLICT',
          `판매자가 보유한 판매용 카드 수량이 부족합니다. 현재 구매 요청 수량: ${quantity}, 실제 가능 수량: ${userCards.length}`,
          409
        );
      }

      const purchaseIds = [];

      for (let i = 0; i < quantity; i++) {
        const userCard = userCards[i];

        //1. userCard 소유권 변경
        await tx.userCard.update({
          where: { id: userCard.id },
          data: {
            ownerId: userId,
            status: UserCardStatus.IDLE,
          },
        });

        //2. purchase생성
        const purchase = await tx.purchase.create({
          data: {
            buyerId: userId,
            saleId,
            userCardId: userCard.id,
            type: PurchaseType.POINT,
          },
        });

        purchaseIds.push(purchase.id);
      }

      //3. sale 수량 감소
      await tx.sale.update({
        where: { id: saleId },
        data: {
          quantity: { decrement: quantity },
        },
      });

      //4. 포인트 업데이트
      await tx.user.update({
        where: { id: userId },
        data: { points: buyer.points - totalPrice },
      });
      //@TODO 판매자의 포인트 늘려주기

      //5. 포인트 로그
      await tx.pointLog.createMany({
        data: [
          {
            userId,
            amount: -totalPrice,
            reason: `[구매] saleId ${saleId} / ${quantity} 장`,
            //@TODO 구매 / 판매 enum PointLogReason 처리, saleId -> saleId + 상품명도 기재
          },
          {
            userId: sellerId,
            amount: totalPrice,
            reason: `[판매] saleId ${saleId} / ${quantity} 장`,
          },
        ],
      });

      //6. 판매자에게 알림 전송
      await tx.notification.create({
        data: {
          userId: sellerId,
          type: NotificationType.CARD_PURCHASED,
          content: `saleId : ${saleId} - 당신의 카드가 ${buyer.nickname} 님에게 ${quantity}장 판매되었습니다. 포인트가 ${totalPrice}만큼 상승하였습니다`,
        },
      });

      return { purchaseIds };
    },
    {
      timeout: 10_000,
      maxWait: 12_000,
    }
  );
};

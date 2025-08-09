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

      //@TODO freshSale여부 확인 - 구매시작직전에 판매자가 판매카드정보 변동여부 확인 판매수량, 가격, 판매내렸는지 등
      // 그리고 구매직전 soldout됐는지 판단후 아래 로직 생력할수도 있지않을까
      //@TODO 매진시 알림 추가
      // transaction 내부 로직이 매우 많음 -> 더 줄일수 없는지
      // 

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
        const { count: moved } = await tx.userCard.updateMany({
          where: { id: userCard.id, ownerId: sellerId, status: UserCardStatus.ON_SALE },
          data: {
            ownerId: userId,
            status: UserCardStatus.IDLE,
          },
        });
        if (moved !== 1) {
          throwApiError(
            'USERCARD_ALREADY_TAKEN_CONFLICT',
            '다른 구매에 의해 이미 소유권이 변경되어 충돌이 일어났습니다.',
            409
          );
        }

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
      const { count } = await tx.sale.updateMany({
        //update-> updateMany 조건을 만족하면 1 못하면 count 0
        //update로 했을때는 조건부 불만족시 Prisma 기본에러 RecordNotFound에러만 뱉어서 에러분기 따로 해줘야함
        where: { id: saleId, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });
      if (count !== 1) {
        throwApiError('INSUFFICIENT_QUANTITY_CONFLICT', '구매 처리 중 품절되었습니다.', 409);
      }

      //4. 포인트 업데이트
      //4-1 구매자 포인트 차감
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: totalPrice } },
        // data: { points: buyer.points - totalPrice },
        //
      });

      //4-2 판매자 포인트 증가
      await tx.user.update({
        where: { id: sellerId },
        data: { points: { increment: totalPrice } },
      });

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

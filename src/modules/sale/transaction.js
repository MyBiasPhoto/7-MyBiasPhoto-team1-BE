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

      // 6) 알림
      await repo.createPurchasedNotification(
        { sellerId, buyerNickname: buyer.nickname, saleId, quantity, amount: totalPrice },
        tx
      );

      return { purchaseIds };
    },
    {
      timeout: 10_000,
      maxWait: 12_000,
    }
  );
};

//     const purchase = await repo.createPurchase(
//       { buyerId: userId, saleId, userCardId: uc.id },
//       tx
//     );
//     purchaseIds.push(purchase.id);
//   }

//   const price = sale.price;

//   //  명령적 - 어떤 상태를 바꿀때마다 어떤 요소를 이렇게 이렇게 명령
//   //  선언적 - 리액트 렌더링 -상태에따라 이렇게 그릴거야(선언) -> 상태만 관리하면 되는구나 유지보수 용이

//   //@TODO freshSale여부 확인 - 구매시작직전에 판매자가 판매카드정보 변동여부 확인 판매수량, 가격, 판매내렸는지 등
//   // 그리고 구매직전 soldout됐는지 판단후 아래 로직 생력할수도 있지않을까
//   //@TODO 매진시 알림 추가
//   // transaction 내부 로직이 매우 많음 -> 더 줄일수 없는지
//   //

//   const userCards = await tx.userCard.findMany({
//     where: {
//       photoCardId: sale.photoCardId,
//       ownerId: sellerId,
//       status: UserCardStatus.ON_SALE,
//     },
//     orderBy: { createdAt: 'asc' },
//     take: quantity,
//   });

//   if (userCards.length < quantity) {
//     throwApiError(
//       'INSUFFICIENT_USERCARDS_CONFLICT',
//       `판매자가 보유한 판매용 카드 수량이 부족합니다. 현재 구매 요청 수량: ${quantity}, 실제 가능 수량: ${userCards.length}`,
//       409
//     );
//   }

//   for (let i = 0; i < quantity; i++) {
//     const userCard = userCards[i];

//     //1. userCard 소유권 변경
//     const { count: moved } = await tx.userCard.updateMany({
//       where: { id: userCard.id, ownerId: sellerId, status: UserCardStatus.ON_SALE },
//       data: {
//         ownerId: userId,
//         status: UserCardStatus.IDLE,
//       },
//     });
//     if (moved !== 1) {
//       throwApiError(
//         'USERCARD_ALREADY_TAKEN_CONFLICT',
//         '다른 구매에 의해 이미 소유권이 변경되어 충돌이 일어났습니다.',
//         409
//       );
//     }

//     //2. purchase생성
//     const purchase = await tx.purchase.create({
//       data: {
//         buyerId: userId,
//         saleId,
//         userCardId: userCard.id,
//         type: PurchaseType.POINT,
//       },
//     });

//     purchaseIds.push(purchase.id);
//   }

//   //3. sale 수량 감소
//   const { count } = await tx.sale.updateMany({
//     //update-> updateMany 조건을 만족하면 1 못하면 count 0
//     //update로 했을때는 조건부 불만족시 Prisma 기본에러 RecordNotFound에러만 뱉어서 에러분기 따로 해줘야함
//     where: { id: saleId, quantity: { gte: quantity } },
//     data: { quantity: { decrement: quantity } },
//   });
//   if (count !== 1) {
//     throwApiError('INSUFFICIENT_QUANTITY_CONFLICT', '구매 처리 중 품절되었습니다.', 409);
//   }

//   //4. 포인트 업데이트
//   //4-1 구매자 포인트 차감
//   await tx.user.update({
//     where: { id: userId },
//     data: { points: { decrement: totalPrice } },
//     // data: { points: buyer.points - totalPrice },
//     //
//   });

//   //4-2 판매자 포인트 증가
//   await tx.user.update({
//     where: { id: sellerId },
//     data: { points: { increment: totalPrice } },
//   });

//   //5. 포인트 로그
//   await tx.pointLog.createMany({
//     data: [
//       {
//         userId,
//         amount: -totalPrice,
//         reason: `[구매] saleId ${saleId} / ${quantity} 장`,
//         //@TODO 구매 / 판매 enum PointLogReason 처리, saleId -> saleId + 상품명도 기재
//       },
//       {
//         userId: sellerId,
//         amount: totalPrice,
//         reason: `[판매] saleId ${saleId} / ${quantity} 장`,
//       },
//     ],
//   });

//   //6. 판매자에게 알림 전송
//   await tx.notification.create({
//     data: {
//       userId: sellerId,
//       type: NotificationType.CARD_PURCHASED,
//       content: `saleId : ${saleId} - 당신의 카드가 ${buyer.nickname} 님에게 ${quantity}장 판매되었습니다. 포인트가 ${totalPrice}만큼 상승하였습니다`,
//     },
//   });

//   return { purchaseIds };
// },

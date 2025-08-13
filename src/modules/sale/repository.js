// src/modules/sale/repository.js
import { prisma } from '../../common/utils/prisma.js';
import { UserCardStatus, PurchaseType, NotificationType } from '@prisma/client';

class SaleRepository {
  getSaleList = async ({ where, orderByClause, include, skip, take }) => {
    const sales = await prisma.sale.findMany({
      where,
      orderBy: orderByClause || { createdAt: 'desc' },
      skip,
      take,
      include,
    });
    return sales;
  };

  getTotalCount = async ({ where }) => {
    const totalCount = await prisma.sale.count({ where });
    return totalCount;
  };
  //   return { saleList, totalCount };
  // }
  getOnSaleCountsByGrade = async () => {
    const rows = await prisma.$queryRaw`
    SELECT "photoCard"."grade" AS grade, COUNT(*)::int AS count
      FROM "Sale" s
      JOIN "PhotoCard" "photoCard" ON "photoCard"."id" = s."photoCardId"
      WHERE s."quantity" > 0 AND s."deletedAt" IS NULL
      GROUP BY "photoCard"."grade"
      `;

    return rows;
  };

  async getSaleCardById(id) {
    const saleCard = await prisma.sale.findUnique({
      where: { id },
      include: {
        photoCard: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            grade: true,
            genre: true,
            initialPrice: true,
            totalQuantity: true,
          },
        },
        seller: {
          select: {
            nickname: true,
          },
        },
        proposals: {
          select: {
            id: true,
            proposedCardId: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            proposer: {
              select: {
                id: true,
                nickname: true,
              },
            },
            proposedCard: {
              select: {
                id: true,
                status: true,
                photoCard: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    grade: true,
                    genre: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return saleCard;
  }

  async patchSaleCardById(id, patchData) {
    console.log('레포에서id', id);
    const check = await prisma.sale.findUnique({
      where: { id },
    });

    if (!check) {
      throw new Error('존재하지않는 카드입니다.');
    }

    const patchCard = await prisma.sale.update({
      where: { id },
      data: patchData,
    });
    return patchCard;
  }

  async patchSaleListById(id, deletedAt) {
    const patch = await prisma.sale.update({
      where: { id },
      data: deletedAt,
    });
    return patch;
  }

  getSaleById = async (id) => {
    return await prisma.sale.findUnique({
      where: { id },
    });
  };

  getUserById = async (id) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  };

  //-- 트랜잭션에서 사용할 메서드들 (client 주입 가능) ---

  //판매가능한 유저카드목록
  getUserCardsForSale = async ({ photoCardId, sellerId, take }, client = prisma) => {
    return client.userCard.findMany({
      where: { photoCardId, ownerId: sellerId, status: UserCardStatus.ON_SALE },
      orderBy: { createdAt: 'asc' },
      take,
    });
  };

  //userCardStatus On_SALE일때만 구매자에게 소유권 이전 //updateMany return값 count:1 - 성공 0: 실패
  transferUserCardIfOnSale = async ({ userCardId, sellerId, buyerId }, client = prisma) => {
    return client.userCard.updateMany({
      where: { id: userCardId, ownerId: sellerId, status: UserCardStatus.ON_SALE },
      data: { ownerId: buyerId, status: UserCardStatus.IDLE },
    });
  };

  //Purchase 테이블 레코드 생성 type: POINT
  createPurchase = async ({ buyerId, saleId, userCardId }, client = prisma) => {
    return client.purchase.create({
      data: { buyerId, saleId, userCardId, type: PurchaseType.POINT },
    });
  };

  //판매수량 감소 (재고수량이 충분할때만) - expectedPrice가 주어지면 가격까지 일치해야 감소 - 판매자가 판매정보 수정시 거래 방지
  decrementSaleQuantityIfEnough = async ({ saleId, quantity, expectedPrice }, client = prisma) => {
    return client.sale.updateMany({
      where: {
        id: saleId,
        quantity: { gte: quantity },
        ...(expectedPrice && { price: expectedPrice }),
      },
      data: { quantity: { decrement: quantity } },
    });
  };

  getSaleQuantity = async ({ saleId }, client = prisma) => {
    const row = await client.sale.findUnique({
      where: { id: saleId },
      select: { quantity: true },
    });
    return row?.quantity ?? null;
  };

  //구매자 포인트 차감 (잔액 충분할때만)
  decrementBuyerPointsIfEnough = async ({ userId, amount }, client = prisma) => {
    return client.user.updateMany({
      where: { id: userId, points: { gte: amount } },
      data: { points: { decrement: amount } },
    });
  };

  //판매자 포인트 증가
  incrementSellerPoints = async ({ userId, amount }, client = prisma) => {
    return client.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
  };

  //포인트 로그 레코드 2개 생성
  createPointLogs = async ({ buyerId, sellerId, amount, saleId, quantity }, client = prisma) => {
    return client.pointLog.createMany({
      data: [
        { userId: buyerId, amount: -amount, reason: `[구매] saleId ${saleId} / ${quantity}장` },
        { userId: sellerId, amount: amount, reason: `[판매] saleId ${saleId} / ${quantity}장` },
      ],
    });
  };

  // 판매완료 알림생성
  createPurchasedNotification = async (
    { sellerId, buyerNickname, saleId, quantity, amount },
    client = prisma
  ) => {
    return client.notification.create({
      data: {
        userId: sellerId,
        type: NotificationType.CARD_PURCHASED,
        content: `saleId ${saleId} - ${buyerNickname} 님에게 ${quantity}장 판매되었습니다. +${amount}P`,
      },
    });
  };

  // 모든카드 판매알림도 추가예정
  createSoldOutNotification = ({ sellerId, saleId }, client = prisma) => {
    return client.notification.create({
      data: {
        userId: sellerId,
        type: NotificationType.CARD_SOLD_OUT,
        content: `saleId ${saleId} - 등록하신 카드가 모두 판매되었습니다.`,
      },
    });
  };

  executeBuySaleTx = async (txArgs) => {
    const { executeBuySaleTx } = await import('./transaction.js');
    // import 해서 똑 때오는게 아니라서 class 형으로 작성하여 서로가 서로를 의존하는 수가 생김
    // 의존성 순환 (Circular Dependency)발생할때 await import 걸어서 회피
    //   SaleRepository → transaction.js
    // transaction.js → 또다시 SaleRepository 참조할 경우
    return await executeBuySaleTx({ ...txArgs, repo: this });
  };
}

export default SaleRepository;

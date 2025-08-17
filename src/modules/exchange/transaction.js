// src/modules/exchange/transaction.js
import { prisma } from '../../common/utils/prisma.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

export async function executeCreateProposalTx(
  repo,
  { proposerId, saleId, proposedCardId, message }
) {
  return await prisma.$transaction(
    async (tx) => {
      const notificationIds = [];

      // 1. 판매글 조회
      const sale = await repo.getSaleForExchangeTx(tx, saleId);
      if (!sale) {
        throwApiError('SALE_NOT_FOUND', '해당 판매글이 존재하지 않습니다.', 404);
      }

      // 2. 내 카드 조회
      const myCard = await repo.getUserCardForExchangeTx(tx, proposerId, proposedCardId);
      if (!myCard) {
        throwApiError('USERCARD_NOT_FOUND', '제안에 사용할 내 카드가 없습니다.', 404);
      }

      // 3. 중복 제안 체크
      const dup = await repo.findDuplicateProposalTx(tx, saleId, proposerId, proposedCardId);
      if (dup) {
        throwApiError('DUPLICATE_PROPOSAL', '이미 동일한 제안을 보냈습니다.', 400);
      }

      // 4. 제안 생성
      const proposal = await repo.createExchangeProposalTx(tx, {
        saleId,
        proposerId,
        proposedCardId,
        message,
      });

      // 5. 내 카드 상태 변경
      await repo.updateUserCardStatusTx(tx, proposedCardId, 'PROPOSED');

      // 6. 알림 생성: 판매자(수신자)에게 제안 도착
      const proposalReceived = await repo.createProposalReceivedNotification(
        {
          targetUserId: sale.seller.id,
          saleId: sale.id,
          proposerNickname:
            (await tx.user.findUnique({ where: { id: proposerId }, select: { nickname: true } }))
              ?.nickname ?? '상대방',
        },
        tx
      );
      notificationIds.push(proposalReceived.id);

      return { proposal, notificationIds };
    },
    { timeout: 20_000, maxWait: 25_000 }
  );
}

export async function executeCancelProposalTx(repo, { proposerId, proposalId }) {
  return await prisma.$transaction(
    async (tx) => {
      const proposal = await repo.getProposalForCancelTx(tx, proposalId, proposerId);
      if (!proposal) throwApiError('PROPOSAL_NOT_FOUND', '취소할 제안을 찾을 수 없습니다.', 404);

      await repo.updateProposalStatusTx(tx, proposal.id, 'CANCELLED');
      await repo.updateUserCardStatusTx(tx, proposal.proposedCardId, 'IDLE');

      return { id: proposal.id, status: 'CANCELLED' };
    },
    { timeout: 20_000, maxWait: 25_000 }
  );
}

export async function executeAcceptProposalTx(repo, { sellerId, proposalId }) {
  return await prisma.$transaction(
    async (tx) => {
      const notificationIds = [];

      const proposal = await repo.getProposalForSellerTx(tx, proposalId, sellerId);
      if (!proposal) {
        throwApiError('PROPOSAL_NOT_FOUND', '승인할 제안을 찾을 수 없습니다.', 404);
      }

      // 판매자 카드 1장 확보 (ON_SALE 상태)
      const sellerCard = await tx.userCard.findFirst({
        where: {
          ownerId: sellerId,
          photoCardId: proposal.sale.photoCardId,
          status: 'ON_SALE',
        },
      });

      if (!sellerCard) {
        throwApiError('SELLER_CARD_NOT_FOUND', '판매자의 교환 가능한 카드가 없습니다.', 400);
      }

      // 1. 승인된 제안 상태 변경
      await repo.updateProposalStatusTx(tx, proposal.id, 'ACCEPTED');

      // 2. 카드 소유권 교환
      // 제안자의 카드 → 판매자 소유
      await repo.updateUserCardOwnerAndStatusTx(tx, proposal.proposedCardId, sellerId, 'IDLE');

      // 판매자의 카드 → 제안자 소유
      await repo.updateUserCardOwnerAndStatusTx(tx, sellerCard.id, proposal.proposerId, 'IDLE');

      // 3. 판매 수량 1 감소
      const updatedSale = await repo.decrementSaleQuantityTx(tx, proposal.saleId, 1);
      const remainingQuantity = updatedSale.quantity;

      // 4. 거래 로그 생성
      await tx.purchase.createMany({
        data: [
          {
            buyerId: proposal.proposerId,
            saleId: proposal.saleId,
            userCardId: sellerCard.id,
            type: 'EXCHANGE',
          },
          {
            buyerId: sellerId,
            saleId: proposal.saleId,
            userCardId: proposal.proposedCardId,
            type: 'EXCHANGE',
          },
        ],
      });

      // 5) 남은 수량이 0일 때만 나머지 제안 자동 거절 + 카드 상태 원복
      if (remainingQuantity === 0) {
        await repo.rejectOtherProposalsForSaleTx(tx, proposal.saleId, proposal.id);
      }

      // 6) 알림 생성: 제안자에게 "승인" 결정 알림
      const decidedForProposer = await repo.createProposalDecidedNotification(
        {
          targetUserId: proposal.proposerId,
          saleId: proposal.saleId,
          decided: 'ACCEPTED',
          link: `/marketPlace/${proposal.saleId}`, // 구매자용 링크
        },
        tx
      );
      notificationIds.push(decidedForProposer.id);

      //  판매자에게도 교환성립했다고 알림
      const decidedForSeller = await repo.createProposalDecidedNotification(
        {
          targetUserId: sellerId,
          saleId: proposal.saleId,
          decided: 'ACCEPTED',
          link: `/marketPlace/${proposal.saleId}/edit`, // 판매자용 링크
        },
        tx
      );
      notificationIds.push(decidedForSeller.id);

      //  수량이 0이 되었다면 판매자에게 품절 알림
      if (remainingQuantity === 0) {
        const soldOut = await repo.createSoldOutNotification(
          { sellerUserId: sellerId, saleId: proposal.saleId },
          tx
        );
        notificationIds.push(soldOut.id);
      }

      // 남은 수량 반환
      return { id: proposal.id, status: 'ACCEPTED', remainingQuantity, notificationIds };
    },
    { timeout: 20_000, maxWait: 25_000 }
  );
}

export async function executeRejectProposalTx(repo, { sellerId, proposalId }) {
  return await prisma.$transaction(
    async (tx) => {
      const notificationIds = [];

      const proposal = await repo.getProposalForSellerTx(tx, proposalId, sellerId);
      if (!proposal) throwApiError('PROPOSAL_NOT_FOUND', '거절할 제안을 찾을 수 없습니다.', 404);

      await repo.updateProposalStatusTx(tx, proposal.id, 'REJECTED');
      await repo.updateUserCardStatusTx(tx, proposal.proposedCardId, 'IDLE');

      const decidedForProposer = await repo.createProposalDecidedNotification(
        {
          targetUserId: proposal.proposerId,
          saleId: proposal.saleId,
          decided: 'REJECTED',
          link: `/marketPlace/${proposal.saleId}`, // 구매자용 링크
        },
        tx
      );
      notificationIds.push(decidedForProposer.id);

      return { id: proposal.id, status: 'REJECTED', notificationIds };
    },
    { timeout: 20_000, maxWait: 25_000 }
  );
}

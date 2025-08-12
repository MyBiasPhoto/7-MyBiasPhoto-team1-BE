import { prisma } from '../../common/utils/prisma.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

export async function executeCreateProposalTx(
  repo,
  { proposerId, saleId, proposedCardId, message }
) {
  return await prisma.$transaction(async (tx) => {
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

    return proposal;
  });
}

export async function executeCancelProposalTx(repo, { proposerId, proposalId }) {
  return await prisma.$transaction(async (tx) => {
    const proposal = await repo.getProposalForCancelTx(tx, proposalId, proposerId);
    if (!proposal) throwApiError('PROPOSAL_NOT_FOUND', '취소할 제안을 찾을 수 없습니다.', 404);

    await repo.updateProposalStatusTx(tx, proposal.id, 'CANCELLED');
    await repo.updateUserCardStatusTx(tx, proposal.proposedCardId, 'IDLE');

    return { id: proposal.id, status: 'CANCELLED' };
  });
}

export async function executeAcceptProposalTx(repo, { sellerId, proposalId }) {
  return await prisma.$transaction(async (tx) => {
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
    await repo.decrementSaleQuantityTx(tx, proposal.saleId, 1);

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

    // 5. 같은 판매글의 나머지 제안 자동 거절 + 카드 상태 원복
    await repo.rejectOtherProposalsForSaleTx(tx, proposal.saleId, proposal.id);

    return { id: proposal.id, status: 'ACCEPTED' };
  });
}

export async function executeRejectProposalTx(repo, { sellerId, proposalId }) {
  return await prisma.$transaction(async (tx) => {
    const proposal = await repo.getProposalForSellerTx(tx, proposalId, sellerId);
    if (!proposal) throwApiError('PROPOSAL_NOT_FOUND', '거절할 제안을 찾을 수 없습니다.', 404);

    await repo.updateProposalStatusTx(tx, proposal.id, 'REJECTED');
    await repo.updateUserCardStatusTx(tx, proposal.proposedCardId, 'IDLE');

    return { id: proposal.id, status: 'REJECTED' };
  });
}

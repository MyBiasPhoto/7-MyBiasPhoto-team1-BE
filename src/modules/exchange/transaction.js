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
    await repo.updateUserCardStatusTx(tx, proposedCardId, 'IDLE');

    return proposal;
  });
}

export async function cancelProposalTx(repo, { userId, proposalId }) {
  return await prisma.$transaction(async (tx) => {
    // 권한 + 존재 확인
    const proposal = await repo.getProposalForOwnerTx(tx, proposalId, userId);
    if (!proposal) {
      throwApiError('PROPOSAL_NOT_FOUND', '해당 제안을 찾을 수 없습니다.', 404);
    }

    if (proposal.status !== 'PENDING') {
      throwApiError('INVALID_STATUS', '대기중(PENDING)인 제안만 취소할 수 있습니다.', 400);
    }

    // 소프트 캔슬
    await repo.cancelProposalStatusTx(tx, proposalId);

    // (선택) 카드 상태 원복: 제안 시 PROPOSED로 잠궜다면 여기서 IDLE로
    // await repo.updateUserCardStatusTx(tx, proposal.proposedCardId, 'IDLE');

    return true;
  });
}

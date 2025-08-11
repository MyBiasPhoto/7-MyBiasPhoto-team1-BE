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
    await repo.updateUserCardStatusTx(tx, proposedCardId, 'ON_PROPOSAL');

    return proposal;
  });
}

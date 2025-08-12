import { prisma } from '../../common/utils/prisma.js';

class ExchangeRepository {
  // ---------- 트랜잭션용 ----------
  async getSaleForExchangeTx(tx, saleId) {
    return await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        photoCard: true,
        seller: { select: { id: true, nickname: true } },
      },
    });
  }

  async getUserCardForExchangeTx(tx, ownerId, userCardId) {
    return await tx.userCard.findFirst({
      where: {
        id: userCardId,
        ownerId,
        status: 'IDLE',
      },
      include: { photoCard: true },
    });
  }

  async findDuplicateProposalTx(tx, saleId, proposerId, proposedCardId) {
    return await tx.exchangeProposal.findFirst({
      where: {
        saleId,
        proposerId,
        proposedCardId,
        status: 'PENDING',
      },
    });
  }

  async createExchangeProposalTx(tx, { saleId, proposerId, proposedCardId, message }) {
    return await tx.exchangeProposal.create({
      data: {
        saleId,
        proposerId,
        proposedCardId,
        message,
        status: 'PENDING',
      },
      include: {
        sale: {
          include: {
            photoCard: true,
            seller: { select: { nickname: true } },
          },
        },
        proposedCard: {
          include: { photoCard: true },
        },
      },
    });
  }

  async updateUserCardStatusTx(tx, userCardId, status) {
    return await tx.userCard.update({
      where: { id: userCardId },
      data: { status },
    });
  }

  // ---------- 제시 취소 ----------
  async getProposalForCancelTx(tx, proposalId, proposerId) {
    return await tx.exchangeProposal.findFirst({
      where: { id: proposalId, proposerId, status: 'PENDING' },
      include: { proposedCard: true },
    });
  }

  // ---------- 판매자 승인 / 거절 ----------
  async getProposalForSellerTx(tx, proposalId, sellerId) {
    const proposal = await tx.exchangeProposal.findFirst({
      where: { id: proposalId, status: 'PENDING' },
      include: {
        sale: {
          include: { seller: true },
        },
        proposedCard: true,
      },
    });

    if (!proposal) return null;
    if (proposal.sale.seller.id !== sellerId) return null;
    return proposal;
  }

  async updateProposalStatusTx(tx, proposalId, status) {
    return await tx.exchangeProposal.update({
      where: { id: proposalId },
      data: { status },
    });
  }

  async rejectOtherProposalsForSaleTx(tx, saleId, exceptProposalId) {
    // 나머지 PENDING → REJECTED
    await tx.exchangeProposal.updateMany({
      where: {
        saleId,
        status: 'PENDING',
        id: { not: exceptProposalId },
      },
      data: { status: 'REJECTED' },
    });

    // 거절된 제안 카드 상태 원복
    await tx.userCard.updateMany({
      where: {
        exchangeProposals: {
          some: {
            saleId,
            status: 'REJECTED',
          },
        },
        status: 'PROPOSED',
      },
      data: { status: 'IDLE' },
    });
  }
  // 카드 소유자 및 상태 변경
  async updateUserCardOwnerAndStatusTx(tx, userCardId, newOwnerId, status) {
    return await tx.userCard.update({
      where: { id: userCardId },
      data: { ownerId: newOwnerId, status },
    });
  }

  // 판매 수량 감소
  async decrementSaleQuantityTx(tx, saleId, amount) {
    return await tx.sale.update({
      where: { id: saleId },
      data: { quantity: { decrement: amount } },
    });
  }

  // ---------- 조회 ----------
  async getMyProposals(userId, { page, pageSize, status }) {
    const skip = (page - 1) * pageSize;
    const where = {
      proposerId: userId,
      ...(status && { status }),
    };

    const proposals = await prisma.exchangeProposal.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        sale: { include: { photoCard: true, seller: true } },
        proposedCard: { include: { photoCard: true } },
      },
    });

    const totalCount = await prisma.exchangeProposal.count({ where });
    return { proposals, totalCount };
  }

  async getReceivedProposals(userId, saleId) {
    return await prisma.exchangeProposal.findMany({
      where: {
        saleId,
        sale: { sellerId: userId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        proposer: { select: { id: true, nickname: true } },
        proposedCard: { include: { photoCard: true } },
      },
    });
  }

  // ---------- 트랜잭션 실행 ----------
  async executeCreateProposalTx(args) {
    const { executeCreateProposalTx } = await import('./transaction.js');
    return await executeCreateProposalTx(this, args);
  }
  async executeCancelProposalTx(args) {
    const { executeCancelProposalTx } = await import('./transaction.js');
    return await executeCancelProposalTx(this, args);
  }
  async executeAcceptProposalTx(args) {
    const { executeAcceptProposalTx } = await import('./transaction.js');
    return await executeAcceptProposalTx(this, args);
  }
  async executeRejectProposalTx(args) {
    const { executeRejectProposalTx } = await import('./transaction.js');
    return await executeRejectProposalTx(this, args);
  }
}

export default ExchangeRepository;

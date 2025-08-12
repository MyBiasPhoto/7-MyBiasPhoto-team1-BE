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
  async getProposalForOwnerTx(tx, proposalId, ownerId) {
    return await tx.exchangeProposal.findFirst({
      where: { id: proposalId, proposerId: ownerId },
      include: { proposedCard: true, sale: true },
    });
  }

  async cancelProposalStatusTx(tx, proposalId) {
    return await tx.exchangeProposal.update({
      where: { id: proposalId },
      data: { status: 'CANCELLED' },
    });
  }

  // ---------- 일반 조회 ----------
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

  // ---------- 트랜잭션 실행 ----------
  async executeCreateProposalTx(args) {
    const { executeCreateProposalTx } = await import('./transaction.js');
    return await executeCreateProposalTx(this, args);
  }

  async cancelProposalTx(userId, proposalId) {
    const { cancelProposalTx } = await import('./transaction.js');
    return await cancelProposalTx(this, { userId, proposalId });
  }
}

export default ExchangeRepository;

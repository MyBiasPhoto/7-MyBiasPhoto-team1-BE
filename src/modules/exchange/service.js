// src/modules/exchange/service.js
class ExchangeService {
  constructor(exchangeRepository, notificationService) {
    this.exchangeRepository = exchangeRepository;
    this.notificationService = notificationService;
    //주입 누락시 에러
    if (!this.notificationService?.publishMany) {
      throw new Error('NotificationService instance must be injected into ExchangeService');
    }
  }
  // 교환 제시 (구매자)
  async proposeExchange(userId, saleId, payload) {
    const { proposal, notificationIds = [] } =
      await this.exchangeRepository.executeCreateProposalTx({
        proposerId: userId,
        saleId: Number(saleId),
        proposedCardId: payload.proposedCardId,
        message: payload.message,
      });

    if (this.notificationService && notificationIds.length > 0) {
      try {
        await this.notificationService.publishMany(notificationIds);
      } catch (error) {
        console.error('[notifications] proposeExchange - publishMany failed:', error);
      }
    }
    return proposal; // 컨트롤러는 기존과 동일하게 proposal을 받음
  }
  // 교환 제시 취소 (구매자)
  cancelProposal(userId, proposalId) {
    return this.exchangeRepository.executeCancelProposalTx({
      proposerId: userId,
      proposalId: Number(proposalId),
    });
  }
  // 교환 제시 승인 (판매자)
  async acceptProposal(userId, proposalId) {
    const {
      id,
      status,
      remainingQuantity,
      notificationIds = [],
    } = await this.exchangeRepository.executeAcceptProposalTx({
      sellerId: userId,
      proposalId: Number(proposalId),
    });
    if (this.notificationService && notificationIds.length > 0) {
      try {
        await this.notificationService.publishMany(notificationIds);
      } catch (error) {
        console.error('[notifications] acceptProposal - publishMany failed:', error);
      }
    }
    return { id, status, remainingQuantity };
  }
  // 교환 제시 거절 (판매자)
  async rejectProposal(userId, proposalId) {
    const {
      id,
      status,
      notificationIds = [],
    } = await this.exchangeRepository.executeRejectProposalTx({
      sellerId: userId,
      proposalId: Number(proposalId),
    });
    if (this.notificationService && notificationIds.length > 0) {
      try {
        await this.notificationService.publishMany(notificationIds);
      } catch (error) {
        console.error('[notifications] publishMany failed:', error);
      }
    }
    return { id, status };
  }
  // 교환 제시 목록 (구매자)
  listMyProposals(userId, query) {
    return this.exchangeRepository.getMyProposals(userId, query);
  }
  // 받은 교환 제시 목록 (판매자)
  listReceivedProposals(userId, saleId) {
    return this.exchangeRepository.getReceivedProposals(userId, Number(saleId));
  }
}

export default ExchangeService;

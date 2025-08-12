class ExchangeService {
  constructor(exchangeRepository) {
    this.exchangeRepository = exchangeRepository;
  }
  // 교환 제시 (구매자)
  proposeExchange(userId, saleId, payload) {
    return this.exchangeRepository.executeCreateProposalTx({
      proposerId: userId,
      saleId: Number(saleId),
      proposedCardId: payload.proposedCardId,
      message: payload.message,
    });
  }
  // 교환 제시 취소 (구매자)
  cancelProposal(userId, proposalId) {
    return this.exchangeRepository.executeCancelProposalTx({
      proposerId: userId,
      proposalId: Number(proposalId),
    });
  }
  // 교환 제시 승인 (판매자)
  acceptProposal(userId, proposalId) {
    return this.exchangeRepository.executeAcceptProposalTx({
      sellerId: userId,
      proposalId: Number(proposalId),
    });
  }
  // 교환 제시 거절 (판매자)
  rejectProposal(userId, proposalId) {
    return this.exchangeRepository.executeRejectProposalTx({
      sellerId: userId,
      proposalId: Number(proposalId),
    });
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

class ExchangeService {
  constructor(exchangeRepository) {
    this.exchangeRepository = exchangeRepository;
  }

  // 교환 제시 생성
  async proposeExchange(userId, saleId, payload) {
    return await this.exchangeRepository.executeCreateProposalTx({
      proposerId: userId,
      saleId: Number(saleId),
      proposedCardId: payload.proposedCardId,
      message: payload.message,
    });
  }

  // 내 교환 제시 목록
  async listMyProposals(userId, query) {
    return await this.exchangeRepository.getMyProposals(userId, query);
  }

  // 교환 제시 취소
  async cancelProposal(userId, proposalId) {
    return await this.exchangeRepository.cancelProposalTx(userId, proposalId);
  }
}

export default ExchangeService;

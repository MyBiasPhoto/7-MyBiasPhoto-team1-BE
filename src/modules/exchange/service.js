class ExchangeService {
  constructor(exchangeRepository) {
    this.exchangeRepository = exchangeRepository;
  }

  // 교환 제안 생성
  async proposeExchange(userId, saleId, payload) {
    return await this.exchangeRepository.executeCreateProposalTx({
      proposerId: userId,
      saleId: Number(saleId),
      proposedCardId: payload.proposedCardId,
      message: payload.message,
    });
  }

  // 내 제안 목록
  async listMyProposals(userId, query) {
    return await this.exchangeRepository.getMyProposals(userId, query);
  }
}

export default ExchangeService;

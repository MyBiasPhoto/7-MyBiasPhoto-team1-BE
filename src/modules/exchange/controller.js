class ExchangeController {
  constructor(exchangeService) {
    this.exchangeService = exchangeService;
  }

  // 교환 제시 생성 (구매자)
  postExchangeProposal = async (req, res, next) => {
    try {
      const proposal = await this.exchangeService.proposeExchange(
        req.user.id,
        req.params.saleId,
        req.body
      );
      res.status(201).json({
        success: true,
        code: 'EXCHANGE_PROPOSAL_CREATED',
        message: '교환 제안이 생성되었습니다.',
        data: proposal,
      });
    } catch (e) {
      next(e);
    }
  };
  // 교환 제시 취소 (구매자)
  cancelExchangeProposal = async (req, res, next) => {
    try {
      const result = await this.exchangeService.cancelProposal(req.user.id, req.params.proposalId);
      res.json({
        success: true,
        code: 'EXCHANGE_PROPOSAL_CANCELLED',
        message: '교환 제안을 취소했습니다.',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  };
  // 교환 제시 승인 (판매자)
  acceptExchangeProposal = async (req, res, next) => {
    try {
      const result = await this.exchangeService.acceptProposal(req.user.id, req.params.proposalId);
      res.json({
        success: true,
        code: 'EXCHANGE_PROPOSAL_ACCEPTED',
        message: '교환 제안을 승인했습니다.',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  };
  // 교환 제시 거절 (판매자)
  rejectExchangeProposal = async (req, res, next) => {
    try {
      const result = await this.exchangeService.rejectProposal(req.user.id, req.params.proposalId);
      res.json({
        success: true,
        code: 'EXCHANGE_PROPOSAL_REJECTED',
        message: '교환 제안을 거절했습니다.',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  };
  // 교환 제시 목록 (구매자)
  getMyExchangeProposals = async (req, res, next) => {
    try {
      const result = await this.exchangeService.listMyProposals(req.user.id, req.query);
      res.json({ success: true, code: 'MY_EXCHANGE_PROPOSALS', ...result });
    } catch (e) {
      next(e);
    }
  };
  // 받은 교환 제시 목록 (판매자)
  getReceivedProposals = async (req, res, next) => {
    try {
      const proposals = await this.exchangeService.listReceivedProposals(
        req.user.id,
        req.params.saleId
      );
      res.json({ success: true, code: 'RECEIVED_EXCHANGE_PROPOSALS', proposals });
    } catch (e) {
      next(e);
    }
  };
}

export default ExchangeController;

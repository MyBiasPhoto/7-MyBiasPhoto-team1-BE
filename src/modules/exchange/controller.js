class ExchangeController {
  constructor(exchangeService) {
    this.exchangeService = exchangeService;
  }

  // 교환 제안 생성
  postExchangeProposal = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const saleId = req.params.saleId;
      const payload = req.body;

      const proposal = await this.exchangeService.proposeExchange(userId, saleId, payload);

      return res.status(201).json({
        success: true,
        code: 'EXCHANGE_PROPOSAL_CREATED',
        message: '교환 제안이 생성되었습니다.',
        data: proposal,
      });
    } catch (error) {
      next(error);
    }
  };

  // 내가 제안한 교환 목록
  getMyExchangeProposals = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const query = req.query;

      const result = await this.exchangeService.listMyProposals(userId, query);

      return res.status(200).json({
        success: true,
        code: 'MY_EXCHANGE_PROPOSALS',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ExchangeController;

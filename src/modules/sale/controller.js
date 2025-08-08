// src/modules/sale/controller.js
class SaleController {
  constructor(saleService) {
    this.saleService = saleService;
  }

  getSaleList = async (req, res, next) => {
    try {
      console.log('컨트롤러에서 req.query: ', req.query);
      const query = req.query;
      const saleList = await this.saleService.getSaleList(query);
      return res.status(200).json(saleList);
    } catch (error) {
      next(error);
    }
  };
  getSaleCardById = async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log('getSaleCardById에서의 req.parms.id : ', Number(id));

      const saleCardById = await this.saleService.getSaleCardById(id);
      return res.status(200).json(saleCardById);
    } catch (error) {
      next(error);
    }
  };

  patchSaleCardById = async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log('req.params.id:', id);
      const patchData = req.body;
      console.log('PatchSaleCardById에서의 req.parms.id : ', Number(id));
      const saleCardById = await this.saleService.patchSaleCardById(id, patchData);
      return res.status(200).json(saleCardById);
    } catch (error) {
      next(error);
    }
  };

  patchSaleListById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedAt = req.body;

      const saleList = await this.saleService.patchSaleListById(id, deletedAt);

      return res.status(200).json(saleList);
    } catch (error) {
      next(error);
    }
  };
  buySale = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const saleId = Number(req.params.id);
      const { quantity } = req.body;

      if (isNaN(saleId)) {
        return res.status(400).json({
          error: 'INVALID_SALE_ID',
          message: '잘못된 saleID 입니다-isNaN(saleId)통과 불가',
        });
      }

      const result = await this.saleService.buySale(userId, saleId, quantity);

      return res.status(200).json({
        message: `saleId : ${saleId} 카드 ${quantity}장 구매 완료!`,
        data: {
          saleId,
          quantity,
          ...result,
        },
        // ...result,
      });
    } catch (error) {
      //error.message별 에러코드및 error, message 설정

      next(error);
    }
  };
}

export default SaleController;

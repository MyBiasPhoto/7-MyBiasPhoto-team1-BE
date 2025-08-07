class SaleController {
  constructor(saleService) {
    this.saleService = saleService;
  }

  getSaleList = async (req, res, next) => {
    try {
      // console.log('컨트롤러에서 req.query: ', req.query);
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
}

export default SaleController;

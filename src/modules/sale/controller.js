class SaleController {
  constructor(saleService) {
    this.saleService = saleService;
  }

  getSaleList = async (req, res, next) => {
    try {
      const query = req.query;
      const saleList = await this.saleService.getSaleList(query);
      return res.status(200).json(saleList);
    } catch (error) {
      next(error);
    }
  };
}

export default SaleController;

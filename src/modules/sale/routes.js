// src/modules/sale/routes.js
import SaleController from './controller.js';
import SaleService from './service.js';
import SaleRepository from './repository.js';
import Router from 'express';
import { validate } from '../../common/middleware/validate.js';
import { getSaleListSchema } from './schema/getSaleListSchema.js';
import { buySaleSchema } from './schema/buySaleSchema.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';

const saleRouter = Router();

const saleRepository = new SaleRepository();
const saleService = new SaleService(saleRepository);
const saleController = new SaleController(saleService);

saleRouter.get('/', validate(getSaleListSchema, 'query'), saleController.getSaleList);
saleRouter.patch('/:id/delete', saleController.patchSaleListById);
saleRouter.get('/:id', saleController.getSaleCardById);
saleRouter.patch(`/:id`, saleController.patchSaleCardById);
saleRouter.post(
  '/:id/buy',
  validate(buySaleSchema, 'body'),
  verifyAccessToken,
  saleController.buySale
);

export default saleRouter;

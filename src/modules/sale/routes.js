import SaleController from './controller.js';
import SaleService from './service.js';
import SaleRepository from './repository.js';
import Router from 'express';
import { validate } from '../../common/middleware/validate.js';
import { getSaleListSchema } from './schema/getSaleListSchema.js';

const saleRouter = Router();

const saleRepository = new SaleRepository();
const saleService = new SaleService(saleRepository);
const saleController = new SaleController(saleService);

saleRouter.get('/', validate(getSaleListSchema, 'query'), saleController.getSaleList);
saleRouter.get('/:id', saleController.getSaleCardById);
saleRouter.patch(`/:id`,saleController.patchSaleCardById)

export default saleRouter;

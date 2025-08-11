import { Router } from 'express';
import ExchangeRepository from './repository.js';
import ExchangeService from './service.js';
import ExchangeController from './controller.js';
import { validate } from '../../common/middleware/validate.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { exchangeProposalSchema } from './schema/exchangeProposalSchema.js';
import { getExchangeProposalsSchema } from './schema/getExchangeProposalSchema.js';

const exchangeRouter = Router();

const exchangeRepository = new ExchangeRepository();
const exchangeService = new ExchangeService(exchangeRepository);
const exchangeController = new ExchangeController(exchangeService);

// POST /api/sales/:saleId/proposals
exchangeRouter.post(
  '/:saleId/proposals',
  verifyAccessToken,
  validate(exchangeProposalSchema, 'body'),
  exchangeController.postExchangeProposal
);

// GET /api/sales/exchange-proposals/my
exchangeRouter.get(
  '/exchange-proposals/my',
  verifyAccessToken,
  validate(getExchangeProposalsSchema, 'query'),
  exchangeController.getMyExchangeProposals
);

export default exchangeRouter;

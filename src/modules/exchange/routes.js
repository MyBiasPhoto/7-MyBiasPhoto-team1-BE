import { Router } from 'express';
import ExchangeRepository from './repository.js';
import ExchangeService from './service.js';
import ExchangeController from './controller.js';
import { validate } from '../../common/middleware/validate.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { exchangeProposalSchema } from './schema/exchangeProposalSchema.js';
import { getExchangeProposalsSchema } from './schema/getExchangeProposalSchema.js';

const exchangeRouter = Router();

const repo = new ExchangeRepository();
const service = new ExchangeService(repo);
const controller = new ExchangeController(service);

// 교환 제시 (구매자)
exchangeRouter.post(
  '/:saleId/proposals',
  verifyAccessToken,
  validate(exchangeProposalSchema, 'body'),
  controller.postExchangeProposal
);
// 교환 제시 취소 (구매자)
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/cancel',
  verifyAccessToken,
  controller.cancelExchangeProposal
);
// 교환 제시 승인 (판매자)
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/accept',
  verifyAccessToken,
  controller.acceptExchangeProposal
);
// 교환 제시 거절 (판매자)
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/reject',
  verifyAccessToken,
  controller.rejectExchangeProposal
);
// 교환 제시 목록 조회 (구매자)
exchangeRouter.get(
  '/exchange-proposals/my',
  verifyAccessToken,
  validate(getExchangeProposalsSchema, 'query'),
  controller.getMyExchangeProposals
);
// 받은 교환 제시 목록 조회 (판매자)
exchangeRouter.get(
  '/:saleId/exchange-proposals/received',
  verifyAccessToken,
  controller.getReceivedProposals
);

export default exchangeRouter;

import PointController from './controller.js';
import CooldownRepository from './CooldownRepository.js';
import UserRepository from '../user/repository.js';
import PointService from './service.js';
import PointRepository from './repository.js';
import { Router } from 'express';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import PointTransaction from './transaction.js';

const pointRepository = new PointRepository();
const cooldownRepository = new CooldownRepository();
const userRepository = new UserRepository();
const pointTransaction = new PointTransaction(pointRepository, cooldownRepository, userRepository);
const pointService = new PointService(pointRepository, pointTransaction, cooldownRepository);
const pointController = new PointController(pointService);

const pointRouter = Router();

pointRouter.post('/events/random', verifyAccessToken, pointController.postRandomPointEvent);
pointRouter.get('/events/random/status', verifyAccessToken, pointController.getRandomPointStatus);

export default pointRouter;

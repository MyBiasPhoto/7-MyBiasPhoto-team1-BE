import { Router } from 'express';
import userCardRouter from '../userCard/routes.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import UserController from './controller.js';
import UserRepository from './repository.js';

const userRouter = Router();

const userRepository = new UserRepository();
const userController = new UserController(userRepository);

userRouter.get('/me', verifyAccessToken, userController.me);
userRouter.post('/points/charge', verifyAccessToken, userController.chargePoints);
userRouter.use('/me/userCard', userCardRouter);

export default userRouter;

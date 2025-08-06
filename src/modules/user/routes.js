import { Router } from 'express';
import userCardRouter from '../userCard/routes.js';

const userRouter = Router();

userRouter.use('/me/userCard', userCardRouter);
export default userRouter;

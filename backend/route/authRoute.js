import express from 'express';
import { signUp } from '../controller/authController.js';

const authRouter = express.Router();

authRouter.route('/signUp').post(signUp);

export { authRouter };
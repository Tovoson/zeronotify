import express from "express";
import { login, signUp } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUp); //http://localhost:3000/zeronotify/auth/signup
router.post("/login", login);   //http://localhost:3000/zeronotSify/auth/login

export default router;

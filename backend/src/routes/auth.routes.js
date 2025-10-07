import express from "express";
import { login, signUp } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/signup", signUp); //http://localhost:5000/api/auth/signup
router.post("/login", login);   //http://localhost:5000/api/auth/login

export default router;

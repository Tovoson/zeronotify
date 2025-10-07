import express from "express";
import { get_all_sms, get_sms_by_id, get_sms_historique, send_sms } from "../controller/sms.controller.js";

const router = express.Router();

router.post("/send-sms", send_sms); //http://localhost:5000/api/sms/send-sms
router.get("/get-all-sms", get_all_sms); //http://localhost:5000/api/sms/get-all-sms
router.get("/:id", get_sms_by_id); //http://localhost:5000/api/sms/:id
router.get("/:id/historique", get_sms_historique); //http://localhost:5000/api/sms/:id/historique

export default router;
import express from "express";
import { get_all_sms, get_sms_by_id, get_sms_historique, send_sms } from "../controller/sms.controller.js";

const router = express.Router();

router.post("/send-sms", send_sms);
router.get("/get-all-sms", get_all_sms);
router.get("/:id", get_sms_by_id);
router.get("/:id/historique", get_sms_historique);

export default router;
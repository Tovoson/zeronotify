import express from "express";
import { cancelScheduledSms, get_all_sms, get_sms_by_id, get_sms_historique, getQuotaSms, getStatusWorker, send_sms, sendUsingTemplate } from "../controller/sms.controller.js";
import { protectAPI_via_Middleware_token } from "../middleware/auth.js";

const router = express.Router();

router.post("/send-sms", protectAPI_via_Middleware_token, send_sms); //http://localhost:3000/zeronotify/sms/send-sms
router.get("/get-all-sms", protectAPI_via_Middleware_token, get_all_sms); //http://localhost:3000/zeronotify/sms/get-all-sms
router.post("/send-using-template", protectAPI_via_Middleware_token, sendUsingTemplate); //http://localhost:3000/zeronotify/sms/send-using-template
router.get("/quota", protectAPI_via_Middleware_token, getQuotaSms); //http://localhost:3000/zeronotify/sms/quota
router.get("/worker-status", protectAPI_via_Middleware_token, getStatusWorker) //http://localhost:3000/zeronotify/sms/worker-status
router.get("/:id", protectAPI_via_Middleware_token, get_sms_by_id); //http://localhost:3000/zeronotify/sms/:id
router.get("/:id/historique", protectAPI_via_Middleware_token, get_sms_historique); //http://localhost:3000/zeronotify/sms/:id/historique
router.delete('/cancel-scheduled/:id', protectAPI_via_Middleware_token, cancelScheduledSms);

export default router;
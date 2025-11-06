import express from "express";
import { creerTemplate, getTemplateById, listerTemplates, mettreAJourTemplate, supprimerTemplate } from "../controller/template.controller.js";
import { protectAPI_via_Middleware_token } from "../middleware/auth.js";

const router = express.Router();

router.post("/creer-template", protectAPI_via_Middleware_token, creerTemplate); //http://localhost:3000/zeronotify/template/creer-template
router.get("/lister-templates", protectAPI_via_Middleware_token, listerTemplates); //http://localhost:3000/zeronotify/template/lister-templates
router.get("/template/:id", protectAPI_via_Middleware_token, getTemplateById); //http://localhost:3000/zeronotify/template/:id
router.put("/template/:id", protectAPI_via_Middleware_token, mettreAJourTemplate); //http://localhost:3000/zeronotify/template/:id
router.delete("/template/:id", protectAPI_via_Middleware_token, supprimerTemplate); //http://localhost:3000/zeronotify/template/:id

export default router;
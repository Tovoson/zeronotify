import express from "express";
import { creerTemplate, getTemplateById, listerTemplates, mettreAJourTemplate, supprimerTemplate } from "../controller/template.controller.js";

const router = express.Router();

router.post("/creer-template", creerTemplate); //http://localhost:3000/zeronotify/template/creer-template
router.get("/lister-templates/:id", listerTemplates); //http://localhost:3000/zeronotify/template/lister-templates/:id
router.get("/template/:id", getTemplateById); //http://localhost:3000/zeronotify/template/:id
router.put("/template/:id", mettreAJourTemplate); //http://localhost:3000/zeronotify/template/:id
router.delete("/template/:id", supprimerTemplate); //http://localhost:3000/zeronotify/template/:id

export default router;
import express from "express";
import { creerCampagneContacts, listerContacts } from "../controller/contact.controller.js";

const router = express.Router();

router.post("/creer-campagne-contacts", creerCampagneContacts); //http://localhost:3000/zeronotify/contact/creer-campagne-contacts
router.get("/lister-contacts/:id", listerContacts); //http://localhost:3000/zeronotify/contact/lister-contacts/:id

export default router;
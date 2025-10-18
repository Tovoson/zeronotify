import express from "express";
import { creerContact, listerContacts } from "../controller/contact.controller.js";

const router = express.Router();

router.post("/creer-contact", creerContact); //http://localhost:3000/zeronotify/contact/creer-contact
router.get("/lister-contacts/:id", listerContacts); //http://localhost:3000/zeronotify/contact/lister-contacts/:id

export default router;
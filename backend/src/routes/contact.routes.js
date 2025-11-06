import express from "express";
import { creerCampagneContacts, listerContacts, supprimerContact, modifierContact, getContactById } from "../controller/contact.controller.js";
import { protectAPI_via_Middleware_token } from "../middleware/auth.js";

const router = express.Router();

router.post("/creer-campagne-contacts",  protectAPI_via_Middleware_token, creerCampagneContacts); //http://localhost:3000/zeronotify/contact/creer-campagne-contacts
router.get("/lister-contacts", protectAPI_via_Middleware_token, listerContacts); //http://localhost:3000/zeronotify/contact/lister-contacts/
router.delete("/supprimer-contact/:id", protectAPI_via_Middleware_token, supprimerContact); //http://localhost:3000/zeronotify/contact/supprimer-contact/:id
router.put('/modifier-contact/:id', protectAPI_via_Middleware_token, modifierContact) //http://localhost:3000/zeronotify/contact/modifier-contact/:id
router.get('/listerByPk/:id', protectAPI_via_Middleware_token, getContactById) //http://localhost:3000/zeronotify/contact/listerByPk/:id

export default router;
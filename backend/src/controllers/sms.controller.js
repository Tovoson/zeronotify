import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js";
import {
  validerDatesPlanification,
  validerSms,
  validerTableauPhones,
} from "../outils/validateur.js";
import {
  getTemplateFonc,
  preparerSMS,
  validerDonnees,
} from "../outils/getTemplate.js";
import { sendSmsService } from "../services/sendSms.service.js";
import Utilisateur from "../models/utilisateur.models.js";
import { getStatutWorker } from "../services/smsWorker.js";

/**
 * @swagger
 * /zeronotify/sms/send-sms:
 *   post:
 *     summary: Envoyer un SMS
 *     description: Envoie un SMS simple ou de groupe, avec possibilité de planification
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expediteur
 *               - destinataires
 *               - contenu
 *             properties:
 *               expediteur:
 *                 type: string
 *                 example: ZeroNotify
 *               destinataires:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["+261340000000", "+261340000001"]
 *               contenu:
 *                 type: string
 *                 example: Bonjour, ceci est un message test
 *               datePlanifiee:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-01T10:00:00Z"
 *               templateId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: SMS envoyé ou planifié avec succès
 *       400:
 *         description: Données invalides (numéros, contenu, date)
 *       500:
 *         description: Erreur serveur
 */
export const send_sms = async (req, res) => {
  const { 
    expediteur, 
    destinataires, 
    contenu, 
    datePlanifiee, 
    templateId
   } = req.body;

  console.log(expediteur, destinataires, contenu, datePlanifiee, templateId);

  const utilisateurId = req.user.userId;

  // Vérification des numéros de téléphone
  const resultat = validerTableauPhones(destinataires);
  if (!resultat.success) {
    return res.status(400).json({
      success: false,
      message: "Certains numéros de téléphone sont invalides",
      details: resultat,
    });
  }

  //res.status(200).json({ success: true, data: resultat });

  if (!Array.isArray(destinataires) || destinataires.length === 0 || !contenu) {
    return res
      .status(400)
      .json({ success: false, message: "Destinataires ou contenu invalide." });
  }

  // Validation des champs SMS
  const smsValidation = validerSms(expediteur, destinataires, contenu);
  if (!smsValidation.success) {
    return res.status(400).json(smsValidation);
  }

  // Validation de la date de planification
  const validationDate = validerDatesPlanification(datePlanifiee);
  if (!validationDate.success) {
    return res.status(400).json(validationDate);
  }

  const smsType = destinataires.length === 1 ? "simple" : "groupe";
  try {
    const maintenant = new Date();
    const dateEnvoiPrevue = datePlanifiee
      ? new Date(datePlanifiee)
      : maintenant;
    const estPlanifie = dateEnvoiPrevue > maintenant;
    const statusInitial = estPlanifie ? "planifie" : "en_attente";

    // 6️⃣ Si planifié, créer UN SEUL SMS avec tous les destinataires
    if (estPlanifie) {
      const smsPlannifie = await Sms.create({
        expediteur,
        destinataires: destinataires, // Array de numéros
        contenu: contenu, // Array de contenus
        statut: statusInitial,
        dateEnvoi: null,
        date_planifiee: dateEnvoiPrevue,
        total: destinataires.length,
        utilisateur_id: utilisateurId,
        envoyes: 0,
        echecs: 0,
        isPlaned: true,
        type: "planifie",
      });

      return res.status(200).json({
        success: true,
        message: "SMS planifié avec succès",
        data: {
          id: smsPlannifie.id,
          statut: smsPlannifie.statut,
          date_planifiee: smsPlannifie.date_planifiee,
          total: smsPlannifie.total,
        },
      });
    }

    const nouveauSms = await Sms.create({
      expediteur,
      destinataires: destinataires,
      contenu,
      statut: statusInitial,
      dateEnvoi: null,
      date_planifiee: estPlanifie ? datePlanifiee : null,
      total: destinataires.length,
      utilisateur_id: utilisateurId,
      envoyes: 0,
      echecs: 0,
      isPlaned: false,
      type: smsType,
    });

    console.log(`📨 SMS créé (ID: ${nouveauSms.id}) avec ${destinataires.length} destinataires`);
    //res.status(200).json(nouveauSms);

    const destinatairesAvecContenu = destinataires.map((num) => {
      return {
        numero: num,
        contenu: contenu
      }
    })

    console.log(destinatairesAvecContenu);

    // 8️⃣ Appeler le service d'envoi ASYNCHRONE (une seule fois)
    const resultat = await sendSmsService(
      destinatairesAvecContenu, // Passer tout le tableau
      utilisateurId,
      nouveauSms,
      smsType
    );

    // ✅ FIX: Vérifier si headers déjà envoyés
    if (res.headersSent) {
      console.warn("⚠️ Headers déjà envoyés, skip response");
      return;
    }

    // ✅ Une seule réponse
    /* if (resultat.success) {
      return res.status(200).json(resultat);
    } else {
      return res.status(400).json(resultat);
    } */

    // 9️⃣ Retourner immédiatement (le worker gère les vérifications en arrière-plan)
    return res.status(200).json({
      success: true,
      message: resultat.message,
      data: resultat.data,
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error);

    // ✅ FIX: Vérifier si headers déjà envoyés
    if (res.headersSent) {
      console.warn("⚠️ Headers déjà envoyés, skip error response");
      return;
    }
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne est survenue",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/get-all-sms:
 *   get:
 *     summary: Récupérer tous les SMS
 *     description: Liste paginée des SMS avec filtrage optionnel par statut
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, envoye, echec, planifie]
 *         description: Filtrer par statut
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des SMS récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Erreur serveur
 */
export const get_all_sms = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10 } = req.query;
    const { userId } = req.user.userId;

    const offset = (page - 1) * limit;
    const whereClause = statut ? { statut } : {};

    const { count, rows } = await Sms.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      utilisateur_id: userId,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des SMS:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des SMS",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/send-using-template:
 *   post:
 *     summary: Envoyer un SMS avec template
 *     description: Envoie des SMS personnalisés en utilisant un template avec variables
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expediteur
 *               - templateId
 *               - destinataires
 *             properties:
 *               expediteur:
 *                 type: string
 *                 example: ZeroNotify
 *               templateId:
 *                 type: integer
 *                 example: 1
 *               destinataires:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     numero:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     entreprise:
 *                       type: string
 *                 example:
 *                   - numero: "+261340000000"
 *                     nom: Jean
 *                     entreprise: ABC Corp
 *                   - numero: "+261340000001"
 *                     nom: Marie
 *                     entreprise: XYZ Ltd
 *               datePlanifiee:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-01T10:00:00Z"
 *     responses:
 *       200:
 *         description: SMS envoyés avec succès
 *       400:
 *         description: Variables invalides ou template introuvable
 *       404:
 *         description: Template non trouvé
 *       500:
 *         description: Erreur serveur
 */
export const get_sms_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const sms = await Sms.findByPk(id);

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      data: sms,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du SMS:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du SMS",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/quota:
 *   get:
 *     summary: Récupérer le quota SMS restant
 *     description: Retourne le nombre de SMS restants pour l'utilisateur
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quota récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageRestant:
 *                       type: integer
 *                       example: 150
 *       500:
 *         description: Erreur serveur
 */
export const get_sms_historique = async (req, res) => {
  try {
    const { id } = req.params;

    const sms = await Sms.findByPk(id);

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS introuvable",
      });
    }

    const historique = {
      id: sms.id,
      expediteur: sms.expediteur,
      destinataire: sms.destinataire,
      statut: sms.statut,
      dateEnvoi: sms.dateEnvoi,
      createdAt: sms.createdAt,
    };

    return res.status(200).json({
      success: true,
      data: historique,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/worker-status:
 *   get:
 *     summary: Statut du worker d'envoi SMS
 *     description: Retourne l'état actuel du worker qui traite les SMS en arrière-plan
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut du worker récupéré avec succès
 */
export const sendUsingTemplate = async (req, res) => {
  const {
    expediteur,
    templateId,
    destinataires, // Tableau d'objets avec 'numero' + variables
    datePlanifiee,
  } = req.body;

  const utilisateurId = req.user.userId;

  try {

    // 1️⃣ Récupérer et valider le template
    const template = await getTemplateFonc(templateId);
    if (template.status === "fail") {
      return res.status(404).json(template);
    }

    //2️⃣vérification des variables et textes, vérifier s'il y a un variable n'a pas dans le texte ou template
    const validation = validerDonnees(
      destinataires,
      template.data.variablesTemplate
    );

    if (!validation.valide) {
      return res.status(400).json({
        success: false,
        message: "Données des destinataires invalides pour le template fourni",
        details: validation.erreurs,
      });
    }

    // 3️⃣ Préparer les messages personnalisés
    const messages = preparerSMS(template.data.contenuTemplate, destinataires);

    if (!messages.success) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de la préparation des messages",
        erreurs: messages.erreurs,
      });
    }

    console.log("Message préparé : variables ajouté dans le texte", messages);

    // 4️⃣ Construire le tableau des destinataires avec leur contenu personnalisé
    const destinatairesAvecContenu = messages.messages.map((elementMessage, index) => {
    return {
        numero: messages.resultatPhone.valides[index],
        contenu: elementMessage.message
      };
    });

  console.log(destinatairesAvecContenu);

    // 5️⃣ Gérer la planification
    const maintenant = new Date();
    const dateEnvoiPrevue = datePlanifiee
      ? new Date(datePlanifiee)
      : maintenant;
    const estPlanifie = dateEnvoiPrevue > maintenant;
    const statusInitial = estPlanifie ? "planifie" : "en_attente";

    // 6️⃣ Si planifié, créer UN SEUL SMS avec tous les destinataires
    if (estPlanifie) {
      const smsPlannifie = await Sms.create({
        expediteur,
        destinataires: destinatairesAvecContenu.map((d) => d.numero), // Array de numéros
        contenu: destinatairesAvecContenu.map((d) => d.contenu), // Array de contenus
        statut: statusInitial,
        dateEnvoi: null,
        date_planifiee: dateEnvoiPrevue,
        total: destinatairesAvecContenu.length,
        utilisateur_id: utilisateurId,
        envoyes: 0,
        echecs: 0,
        isPlaned: true,
        type: "planifie",
        templateId: templateId,
      });

      return res.status(200).json({
        success: true,
        message: "SMS planifié avec succès",
        data: {
          id: smsPlannifie.id,
          statut: smsPlannifie.statut,
          date_planifiee: smsPlannifie.date_planifiee,
          total: smsPlannifie.total,
        },
      });
    }

    // 7️⃣ ENVOI IMMÉDIAT: Créer UN SEUL SMS pour tout le groupe
    const smsType = destinatairesAvecContenu.length === 1 ? "simple" : "groupe";

    const nouveauSms = await Sms.create({
      expediteur,
      destinataires: destinatairesAvecContenu.map((d) => d.numero),
      contenu: destinatairesAvecContenu.map((d) => d.contenu),
      statut: statusInitial,
      dateEnvoi: null,
      date_planifiee: null,
      total: destinatairesAvecContenu.length,
      utilisateur_id: utilisateurId,
      envoyes: 0,
      echecs: 0,
      isPlaned: false,
      type: smsType,
      templateId: templateId,
    });

    console.log(`📨 SMS créé (ID: ${nouveauSms.id}) avec ${destinatairesAvecContenu.length} destinataires`);
    //res.status(200).json(nouveauSms);

    // 8️⃣ Appeler le service d'envoi ASYNCHRONE (une seule fois)
    const resultat = await sendSmsService(
      destinatairesAvecContenu, // Passer tout le tableau
      utilisateurId,
      nouveauSms,
      smsType
    );

    // 9️⃣ Retourner immédiatement (le worker gère les vérifications en arrière-plan)
    return res.status(200).json({
      success: true,
      message: resultat.message,
      data: resultat.data,
    });

  } catch (error) {
    console.error("Erreur dans sendUsingTemplate:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi des SMS",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/{id}:
 *   get:
 *     summary: Récupérer un SMS par ID
 *     description: Retourne les détails complets d'un SMS spécifique
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du SMS à récupérer
 *     responses:
 *       200:
 *         description: SMS trouvé avec succès
 *       404:
 *         description: SMS introuvable
 *       500:
 *         description: Erreur serveur
 */
export const getQuotaSms = async (req, res) => {
  const utilisateur_id = req.user.userId;
  try {
    const quotaSms = await Utilisateur.findOne({
      attributes: ["messageRestant"],
      where: { id: utilisateur_id },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: quotaSms,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du quota SMS:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du quota SMS",
    });
  }
};

/**
 * @swagger
 * /zeronotify/sms/{id}/historique:
 *   get:
 *     summary: Récupérer l'historique d'un SMS
 *     description: Retourne l'historique d'envoi d'un SMS (statut, dates, etc.)
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du SMS
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *       404:
 *         description: SMS introuvable
 *       500:
 *         description: Erreur serveur
 */
export const getStatusWorker = (req, res) => {
  res.json(getStatutWorker());
}

/**
 * @swagger
 * /zeronotify/sms/cancel-scheduled/{id}:
 *   delete:
 *     summary: Annuler un SMS planifié
 *     description: Annule l'envoi d'un SMS qui était planifié pour plus tard
 *     tags:
 *       - SMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du SMS planifié à annuler
 *     responses:
 *       200:
 *         description: SMS planifié annulé avec succès
 *       400:
 *         description: Le SMS n'est pas planifié
 *       404:
 *         description: SMS non trouvé
 *       500:
 *         description: Erreur serveur
 */
export const cancelScheduledSms = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le SMS existe et est planifié
    const sms = await Sms.findByPk(id);
    
    if (!sms) {
      return res.status(404).json({
        success: false,
        message: "SMS non trouvé"
      });
    }

    if (sms.statut !== "planifie" && !sms.isPlaned) {
      return res.status(400).json({
        success: false,
        message: "Ce SMS n'est pas planifié"
      });
    }

    // Supprimer ou mettre à jour le statut
    await sms.destroy();

    // await sms.update({ statut: "annule", isPlaned: false }); si on veut garder l'historique

    res.json({
      success: true,
      message: "SMS planifié annulé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation du SMS"
    });
  }
};
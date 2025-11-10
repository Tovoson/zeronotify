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

/**
 * Envoyer un SMS et le stocker dans la base de données
 */
export const send_sms = async (req, res) => {
  const { expediteur, destinataires, contenu, datePlanifiee, templateId } =
    req.body;

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

  res.status(200).json({ success: true, data: resultat });

  let nouveauSms;

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

  let smsType;
  if (destinataires.length === 1) {
    smsType = "simple";
  } else {
    smsType = "groupe";
  }

  try {
    const maintenant = new Date();
    const dateEnvoiPrevue = datePlanifiee
      ? new Date(datePlanifiee)
      : maintenant;
    const estPlanifie = dateEnvoiPrevue > maintenant;
    const statusInitial = estPlanifie ? "planifie" : "en_attente";

    nouveauSms = await Sms.create({
      expediteur,
      destinataires: destinataires,
      contenu,
      statut: statusInitial,
      dateEnvoi: null,
      date_planifiee: estPlanifie ? datePlanifiee : null,
      total: Array.isArray(destinataires) ? destinataires.length : 1,
      utilisateur_id: utilisateurId,
      envoyes: 0,
      echecs: 0,
      type: estPlanifie ? "planifie" : smsType,
    });

    // ✅ SI PLANIFIÉ : Enregistrer seulement, ne pas envoyer maintenant
    if (estPlanifie) {
      return res.status(201).json({
        success: true,
        message: "SMS planifié avec succès.",
        data: {
          id: nouveauSms.id,
          expediteur: nouveauSms.expediteur,
          destinataires: nouveauSms.destinataires,
          statut: nouveauSms.statut,
          date_creation: nouveauSms.dateCreation,
          date_planifiee: nouveauSms.date_planifiee,
          total_destinataires: nouveauSms.total,
          contenu: {
            texte: nouveauSms.contenu,
            longueur: nouveauSms.contenu.length,
            segments: Math.ceil(nouveauSms.contenu.length / 160),
          },
        },
      });
    }

    // ✅ ENVOI IMMÉDIAT : Insérer dans Outbox Gammu
    //const sendSmsResult = await sendSmsService(destinataires, contenu, utilisateurId, nouveauSms);
    //if (sendSmsResult.status === "fail") {
    //return res.status(500).json(sendSmsResult);
    //}

    //return res.status(202).json(sendSmsResult);
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne est survenue",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Récupérer tous les SMS
 */
export const get_all_sms = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10 } = req.query;
    const { userId } = req.params;

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
 * Récupérer un SMS par ID
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
 * Récupérer l'historique d'un SMS
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

export const sendUsingTemplate = async (req, res) => {
  const { 
    expediteur,
    templateId, 
    destinataires, //destinataires est un tableau d'objets avec au moins une clé 'numero', 
    //contenu, // Le contenu sera généré à partir du template et des données des destinataires
    datePlanifiee 
  } = req.body;

  const utilisateurId = req.user.userId;

  try {
    const template = await getTemplateFonc(templateId);
    if (template.status === "fail") {
      return res.status(404).json(template);
    }

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

    const messages = preparerSMS(template.data.contenuTemplate, destinataires);

    if (!messages.success) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de la préparation des messages",
        erreurs: messages.erreurs,
      });
    }
    
    console.log(messages);

    let arrayDestinataires = [];

    for(let i = 0; i < messages.messages.length; i++){
      arrayDestinataires.push(messages.messages[i].numero)
    }

    let arrayContenu = [];
    for(let i = 0; i < messages.messages.length; i++){
      arrayContenu.push(messages.messages[i].message)
    }

    console.log(arrayContenu);

    const maintenant = new Date();
    const dateEnvoiPrevue = datePlanifiee
      ? new Date(datePlanifiee)
      : maintenant;
    const estPlanifie = dateEnvoiPrevue > maintenant;
    const statusInitial = estPlanifie ? "planifie" : "en_attente";

    if(estPlanifie){
      return Sms.create({
        expediteur,
        destinataires: arrayDestinataires,
        contenu: arrayContenu,
        statut: statusInitial,
        dateEnvoi: null,
        date_planifiee: estPlanifie ? dateEnvoiPrevue : null,
        total: 1,
        utilisateur_id: utilisateurId,
        envoyes: 0,
        echecs: 0,
        type: estPlanifie ? "planifie" : "groupe",
        templateId: templateId, // Garder trace du template utilisé
      });
    }

    const smsCreations = messages.messages.map((msg) => {
      return Sms.create({
        expediteur,
        destinataires: msg.numero,
        contenu: msg.message,
        statut: statusInitial,
        dateEnvoi: null,
        date_planifiee: estPlanifie ? dateEnvoiPrevue : null,
        total: 1,
        utilisateur_id: utilisateurId,
        envoyes: 0,
        echecs: 0,
        type: estPlanifie ? "planifie" : "groupe",
        templateId: templateId, // Garder trace du template utilisé
      });
    });

    const nouveauxSms = await Promise.all(smsCreations);

    const sendSmsResult = await sendSmsService(destinataires, contenu, utilisateurId, nouveauxSms);
    if (sendSmsResult.status === "fail") {
      return res.status(500).json(sendSmsResult);
    }
  } catch (error) {
    console.error("Erreur dans sendUsingTemplate:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi des SMS",
      error: error.message,
    });
  }
};

export const getQuotaSms = async (req, res) => {

  const utilisateur_id = req.user.userId;
  try {

    const quotaSms = await Utilisateur.findOne({
      attributes: ['messageRestant'],
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

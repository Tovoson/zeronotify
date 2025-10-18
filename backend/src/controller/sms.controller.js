import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js"
import { validerPhone, validerSms } from "../outils/validateur.js";

/**
 * Envoyer un SMS et le stocker dans la base de données
 */
export const send_sms = async (req, res) => {
  let nouveauSms; 

  try {
    
    const { expediteur, destinataires, contenu, utilisateurId, datePlanifiee } = req.body;
    //const expediteurId = req.userId; // Supposons que l'ID de l'utilisateur est dans le token

    const smsValidation = validerSms(expediteur, destinataires, contenu);
    if (!smsValidation.success) {
      return res.status(400).json(smsValidation);
    }

    const validationResponse = validerPhone(destinataires);
    if (!validationResponse.success) {
      return res.status(400).json(validationResponse);
    }

    const statusInitial = datePlanifiee && new Date(datePlanifiee) > new Date() ? "planifie" : "en_attente";

    nouveauSms = await Sms.create({
      expediteur,
      destinataires,
      contenu,
      statut: statusInitial,
      dateEnvoi: null,
      date_planifiee: datePlanifiee || null,
      total: Array.isArray(destinataires) ? destinataires.length : 1,
      utilisateur_id: utilisateurId,
      envoyes: 0,
      echecs: 0, 
    });

    if(statusInitial === "planifie") {
      return res.status(201).json({
        success: true,
        message: "SMS planifié avec succès.",
        data: {
          id: nouveauSms.id,
          expediteur: nouveauSms.expediteur,
          destinataires: nouveauSms.destinataires,
          statut: nouveauSms.statut,
          date_creation: nouveauSms.dateCreation,
          date_planifiee: nouveauSms.datePlanifiee,
          total_destinataires: nouveauSms.totalDestinataires,
          contenu: {
            texte: nouveauSms.contenu,
            longueur: nouveauSms.contenu.length,
            segments: Math.ceil(nouveauSms.contenu.length / 160) // Estimation segments SMS
          }
        },
      });
    }

    // ----------------------------------------------------------------------
    // 3. INTÉGRATION GAMMU SMSD : Insertion dans la file d'attente Outbox
    // ----------------------------------------------------------------------
    try {
      await Outbox.create({
        DestinationNumber: destinataires, 
        TextDecoded: contenu,
        CreatorID: String(nouveauSms.id), 
        Coding: 'Default_No_Compression',
        RelativeValidity: -1, 
      });

      // Mettre à jour le statut
      nouveauSms.statut = "envoye";
      nouveauSms.dateEnvoi = new Date();
      await nouveauSms.save();
      
      // Réponse immédiate au client (statut 202 Accepted recommandé pour les tâches en arrière-plan)
      return res.status(202).json({
        success: true,
        message: "SMS soumis à la file d'attente Gammu SMSD. Envoi en cours...",
        data: {
          id: nouveauSms.id,
          destinataires: nouveauSms.destinataire,
          statut: nouveauSms.statut,
          dates: {
            creation: nouveauSms.dateCreation,
            envoi: nouveauSms.dateEnvoi,
            //reception: nouveauSms.dateReception,
            planifiee: nouveauSms.date_planifiee
          },
          metriques: {
            total_destinataires: nouveauSms.total,
            messages_envoyes: nouveauSms.envoyes,
            messages_echoues: nouveauSms.echecs,
            longueur_contenu: nouveauSms.contenu.length,
            segments_estimes: Math.ceil(nouveauSms.contenu.length / 160)
          },
           contenu: {
            preview: nouveauSms.contenu.substring(0, 50) + (nouveauSms.contenu.length > 50 ? "..." : "")
          }
        },
      });

    } catch (gammuError) {
      // Échec de l'insertion dans la table Outbox (Problème BDD ou schéma)
      
      // Mettre à jour le statut dans votre table de suivi à "echec_soumission"
      nouveauSms.statut = "echec";
      await nouveauSms.save();

      console.error("Erreur d'insertion Outbox (Gammu SMSD):", gammuError);
      return res.status(500).json({
        success: false,
        message: "Échec de la soumission du SMS à Gammu (Erreur BDD Outbox).",
        error: gammuError.message,
        data: { id: nouveauSms.id, statut: nouveauSms.statut },
      });
    }
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

    const offset = (page - 1) * limit;
    const whereClause = statut ? { statut } : {};

    const { count, rows } = await Sms.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
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

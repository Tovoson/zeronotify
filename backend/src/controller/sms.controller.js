import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js"
import { validerPhone } from "../outils/validateur.js";
import testSMS from "../service/connect.js";

/**
 * Envoyer un SMS et le stocker dans la base de données
 */
export const send_sms = async (req, res) => {
  let nouveauSms; // Déclaré en dehors du try pour être accessible en cas d'erreur BDD

  try {
    // 1. Validation des données requises (Inchangé)
    const { expediteur, destinataire, contenu } = req.body;
    const expediteurId = req.userId; // Supposons que l'ID de l'utilisateur est dans le token

    // Remarque: Les validateurs validerSms et validerPhone ne sont pas définis ici.
    const smsValidation = validerSms(expediteur, destinataire, contenu);
    if (!smsValidation.success) {
      return res.status(400).json(smsValidation);
    }
    const validationResponse = validerPhone(destinataire);
    if (!validationResponse.success) {
      return res.status(400).json(validationResponse);
    }

    // 2. Création du SMS en base de données de suivi (votre table 'Sms')
    // Le statut est 'en_attente' car Gammu ne l'a pas encore pris en charge.
    nouveauSms = await Sms.create({
      expediteur,
      destinataire,
      contenu,
      statut: "en_attente",
      dateEnvoi: null,
      // Lier à l'utilisateur actuel
      utilisateurId: expediteurId, 
    });

    // ----------------------------------------------------------------------
    // 3. INTÉGRATION GAMMU SMSD : Insertion dans la file d'attente Outbox
    // ----------------------------------------------------------------------
    try {
      await Outbox.create({
        // Le numéro de destination pour le modem
        DestinationNumber: destinataire, 
        // Le contenu du message
        TextDecoded: contenu,
        // Liaison avec votre modèle de suivi (le lien est l'ID du message de suivi)
        CreatorID: String(nouveauSms.id), 
        // L'encodage par défaut
        Coding: 'Default',
        // Planification immédiate
        RelativeValidity: -1, 
      });

      // Le message est soumis. On met à jour le statut dans votre table de suivi.
      // Le statut "soumis" indique que Gammu devrait le prendre en charge.
      nouveauSms.statut = "soumis_gammu"; 
      await nouveauSms.save();
      
      // Réponse immédiate au client (statut 202 Accepted recommandé pour les tâches en arrière-plan)
      return res.status(202).json({
        success: true,
        message: "SMS soumis à la file d'attente Gammu SMSD. Envoi en cours...",
        data: {
          id: nouveauSms.id,
          destinataire: nouveauSms.destinataire,
          statut: nouveauSms.statut,
        },
      });

    } catch (gammuError) {
      // Échec de l'insertion dans la table Outbox (Problème BDD ou schéma)
      
      // Mettre à jour le statut dans votre table de suivi à "echec_soumission"
      nouveauSms.statut = "echec_soumission";
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

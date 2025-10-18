import Sms from "../models/sms.models.js"
import { validerPhone } from "../routes/outils/validateur.js";
import testSMS from "../service/connect.js";

/**
 * Envoyer un SMS et le stocker dans la base de données
 */
export const send_sms = async (req, res) => {
  try {
    
    // Validation des données requises
    const { expediteur, destinataire, contenu } = req.body;

    const smsValidation = validerSms(expediteur, destinataire, contenu);
    if (!smsValidation.success) {
      return res.status(400).json(smsValidation);
    }

    const validationResponse = validerPhone(destinataire);
    if (!validationResponse.success) {
      return res.status(400).json(validationResponse);
    }

    // Création du SMS en base de données avec statut "en_attente"
    const nouveauSms = await Sms.create({
      expediteur,
      destinataire,
      contenu,
      statut: "en_attente",
      dateEnvoi: null,
    });

    // Simulation de l'envoi du SMS
    try {
      // TODO: Intégrer l'API d'envoi SMS réelle (Twilio, Vonage, etc.)
      // await apiSmsProvider.send({ to: destinataire, from: expediteur, body: contenu });
      // const resp = await testSMS(expediteur, destinataire, contenu);
      // console.log(resp);
      // Simuler un délai d'envoi
      //   await new Promise((resolve) => setTimeout(resolve, 500));

      // Mettre à jour le statut à "envoye"
      nouveauSms.statut = "envoye";
      nouveauSms.dateEnvoi = new Date();
      await nouveauSms.save();

      return res.status(200).json({
        success: true,
        message: "SMS envoyé avec succès",
        data: {
          id: nouveauSms.id,
          expediteur: nouveauSms.expediteur,
          destinataire: nouveauSms.destinataire,
          statut: nouveauSms.statut,
          dateEnvoi: nouveauSms.dateEnvoi,
        },
      });
    } catch (sendError) {
      // En cas d'échec de l'envoi, mettre à jour le statut à "echec"
      nouveauSms.statut = "echec";
      await nouveauSms.save();

      return res.status(500).json({
        success: false,
        message: "Échec de l'envoi du SMS",
        error: sendError.message,
        data: {
          id: nouveauSms.id,
          statut: nouveauSms.statut,
        },
      });
    }
  } catch (error) {
    // Gestion des erreurs de validation Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    // Gestion des erreurs de base de données
    if (error.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        message: "Erreur de base de données",
        error: error.message,
      });
    }

    // Erreur générique
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

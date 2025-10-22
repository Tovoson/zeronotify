import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js"
import { validerDatesPlanification, validerSms } from "../outils/validateur.js";
import { io } from "../app.js";

/**
 * Envoyer un SMS et le stocker dans la base de données
 */
export const send_sms = async (req, res) => {
  const { expediteur, destinataires, contenu, utilisateurId, datePlanifiee } = req.body;
  
  let nouveauSms; 
  
  if (!Array.isArray(destinataires) || destinataires.length === 0 || !contenu) {
    return res.status(400).json({ success: false, message: "Destinataires ou contenu invalide." });
  }
  
  const smsValidation = validerSms(expediteur, destinataires, contenu);
  if (!smsValidation.success) {
    return res.status(400).json(smsValidation);
  }

  const validationDate = validerDatesPlanification(datePlanifiee);
  if (!validationDate.success) {
    return res.status(400).json(validationDate);
  }

  try {
    const maintenant = new Date();
    const dateEnvoiPrevue = datePlanifiee ? new Date(datePlanifiee) : maintenant;
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
      type: estPlanifie ? "planifie" : "groupe", 
    });

    // ✅ SI PLANIFIÉ : Enregistrer seulement, ne pas envoyer maintenant
    if(estPlanifie) {
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
            segments: Math.ceil(nouveauSms.contenu.length / 160)
          }
        },
      });
    }

    // ✅ ENVOI IMMÉDIAT : Insérer dans Outbox Gammu
    try {
      
      const totalDestinataires = destinataires.length;
      let envoyesCount = 0;
      let echecsCount = 0;

      io.emit('sms_envoi_debut', { 
        smsId: nouveauSms.id,
        statut: 'en_cours',
        envoyes: 0,
        echecs: 0,
        totalDestinataires,
        progression: 0
      });

      for(let i = 0; i < destinataires.length; i++) {
        const numero = String(destinataires[i]);

        try {
          await Outbox.create({
            DestinationNumber: numero, 
            TextDecoded: contenu,
            CreatorID: String(nouveauSms.id), 
            Coding: 'Default_No_Compression',
            RelativeValidity: -1, 
          });
          envoyesCount++;

          nouveauSms.statut = "envoye";
          nouveauSms.envoyes = envoyesCount;
          nouveauSms.echecs = echecsCount;
          nouveauSms.dateEnvoi = new Date();
          await nouveauSms.save();

          io.emit('sms_envoi_progression', {
            smsId: nouveauSms.id,
            statut: 'en_cours',
            envoyes: envoyesCount,
            echecs: echecsCount,
            total: totalDestinataires,
            progression: Math.round((envoyesCount + echecsCount) / totalDestinataires * 100),
            dernier_numero: numero
          });
        } catch (error) {
          echecsCount++;
          await nouveauSms.update({ echecs: echecsCount });

          console.error(`❌ Échec envoi à ${numero}:`, error.message);
          
          io.emit('sms_progress', {
            smsId: nouveauSms.id,
            statut: 'en_cours',
            total: totalDestinataires,
            envoyes: envoyesCount,
            echecs: echecsCount,
            progression: Math.round((envoyesCount + echecsCount) / totalDestinataires * 100),
            dernier_echec: numero
          });
        }
      }

      const statutFinal = echecsCount === totalDestinataires ? "echec" : "envoye";
      await nouveauSms.update({
        statut: statutFinal,
        dateEnvoi: new Date()
      });

      io.emit('sms_progress', {
        smsId: nouveauSms.id,
        statut: 'termine',
        total: totalDestinataires,
        envoyes: envoyesCount,
        echecs: echecsCount,
        progression: 100
      });
      
      return res.status(202).json({
        success: true,
        message: `Campagne de ${totalDestinataires} SMS soumise avec succès à Gammu pour envoi.`,
        data: {
          id: nouveauSms.id,
          destinataires: nouveauSms.destinataires,
          statut: nouveauSms.statut,
          metriques: {
            total_destinataires: totalDestinataires,
            messages_envoyes: envoyesCount,
            messages_echoues: echecsCount,
            longueur_contenu: nouveauSms.contenu.length,
            segments_estimes: Math.ceil(nouveauSms.contenu.length / 160)
          },
          websocket_channel: 'sms_progress'
        },
      });
      
      
    } catch (gammuError) {

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

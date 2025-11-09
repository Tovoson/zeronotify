import { io } from "../app.js";
import Outbox from "../models/gammu/outbox.js";
import Utilisateur from "../models/utilisateur.models.js";
import { verifierQuotaSms } from "../outils/validateur.js";

export const sendSmsService = async (destinataires, contenu, utilisateurId, nouveauSms) => {
  try {
    const totalDestinataires = destinataires.length;
    let envoyesCount = 0;
    let echecsCount = 0;

    const quotaActuel = await Utilisateur.findOne({
      attributes: ["messageRestant"],
      where: { id: utilisateurId },
      raw: true,
    });

    const verifierQuota = verifierQuotaSms(
      quotaActuel.messageRestant,
      totalDestinataires
    );
    if (!verifierQuota.success) {
      return { success: false, message: verifierQuota.message };
    }

    io.emit("sms_envoi_debut", {
      smsId: nouveauSms.id,
      statut: "en_cours",
      envoyes: 0,
      echecs: 0,
      totalDestinataires,
      progression: 0,
    });

    for (let i = 0; i < destinataires.length; i++) {
      const numero = String(destinataires[i]);

      try {
        await Outbox.create({
          DestinationNumber: numero,
          TextDecoded: contenu,
          CreatorID: String(nouveauSms.id),
          Coding: "Default_No_Compression",
          RelativeValidity: -1,
        });

        console.log(`✅ SMS inséré dans outbox pour ${numero}`);

        // 2️⃣ Attendre la confirmation d'envoi réel
        const resultatEnvoi = await verifierStatutEnvoi(numero, nouveauSms.id);

        if (resultatEnvoi.success) {
          envoyesCount++;
          console.log(
            `✅ SMS envoyé avec succès à ${numero} - Status: ${resultatEnvoi.data.status}`
          );

          nouveauSms.messageRestant -= 1;
          nouveauSms.statut = "envoye";
          nouveauSms.envoyes = envoyesCount;
          nouveauSms.echecs = echecsCount;
          nouveauSms.dateEnvoi = new Date();
          await nouveauSms.save();

          io.emit("sms_envoi_progression", {
            smsId: nouveauSms.id,
            statut: "en_cours",
            envoyes: envoyesCount,
            echecs: echecsCount,
            total: totalDestinataires,
            progression: Math.round(
              ((envoyesCount + echecsCount) / totalDestinataires) * 100
            ),
            dernier_numero: numero,
          });
        } else {
          echecsCount++;
          console.error(
            `❌ Échec confirmé pour ${numero}: ${resultatEnvoi.reason}`
          );

          await nouveauSms.update({ echecs: echecsCount });

          io.emit("sms_envoi_progression", {
            smsId: nouveauSms.id,
            statut: "en_cours",
            total: totalDestinataires,
            envoyes: envoyesCount,
            echecs: echecsCount,
            progression: Math.round(
              ((envoyesCount + echecsCount) / totalDestinataires) * 100
            ),
            dernier_echec: numero,
            raison_echec: resultatEnvoi.reason,
          });
        }
      } catch (error) {
        echecsCount++;
        await nouveauSms.update({ echecs: echecsCount });

        console.error(`❌ Échec envoi à ${numero}:`, error.message);

        io.emit("sms_progress", {
          smsId: nouveauSms.id,
          statut: "en_cours",
          total: totalDestinataires,
          envoyes: envoyesCount,
          echecs: echecsCount,
          progression: Math.round(
            ((envoyesCount + echecsCount) / totalDestinataires) * 100
          ),
          dernier_echec: numero,
        });
      }
    }

    const statutFinal = echecsCount === totalDestinataires ? "echec" : "envoye";
    await nouveauSms.update({
      statut: statutFinal,
      dateEnvoi: new Date(),
    });

    io.emit("sms_progress", {
      smsId: nouveauSms.id,
      statut: "termine",
      total: totalDestinataires,
      envoyes: envoyesCount,
      echecs: echecsCount,
      progression: 100,
    });

    return {
      success: true,
      message: `Envoi de ${smsType} (${totalDestinataires}) SMS soumise avec succès à Gammu pour envoi.`,
      data: {
        id: nouveauSms.id,
        destinataires: nouveauSms.destinataires,
        statut: nouveauSms.statut,
        metriques: {
          total_destinataires: totalDestinataires,
          messages_envoyes: envoyesCount,
          messages_echoues: echecsCount,
          longueur_contenu: nouveauSms.contenu.length,
          segments_estimes: Math.ceil(nouveauSms.contenu.length / 160),
        },
        websocket_channel: "sms_progress",
      },
    };

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
};

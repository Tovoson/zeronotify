import { io } from "../app.js";
import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js";
import Utilisateur from "../models/utilisateur.models.js";
import { verifierQuotaSms } from "../outils/validateur.js";
import { ajouterAFileVerification } from "./smsWorker.js";

export const sendSmsService = async (
  destinataires, // Array [{numero, contenu}, ...]
  utilisateurId,
  nouveauSms,
  smsType
) => {
  const smsId = nouveauSms.id;
  let nouveauSmsInstance = nouveauSms;

  console.log("🔍 Service reçoit destinataires:", JSON.stringify(destinataires, null, 2));
  console.log("🆔 SMS ID:", smsId, "Type:", smsType);

  if (!smsId) {
    console.error("❌ smsId indéfinie");
    return { success: false, message: "SMS ID manquant" };
  }

  // Validation: destinataires doit être un tableau
  if (!Array.isArray(destinataires)) {
    console.error("❌ destinataires n'est pas un tableau:", typeof destinataires);
    return { success: false, message: "Format de destinataires invalide" };
  }

  // Validation: chaque élément doit avoir numero et contenu
  const elementsInvalides = destinataires.filter(d => !d || !d.numero || !d.contenu);
  if (elementsInvalides.length > 0) {
    console.error("❌ Éléments invalides détectés:", elementsInvalides);
    return { 
      success: false, 
      message: "Certains destinataires n'ont pas de numéro ou contenu",
      invalides: elementsInvalides
    };
  }

  // SAFEGUARD: Assurer que l'objet est une instance Sequelize
  if (!nouveauSmsInstance || typeof nouveauSmsInstance.update !== "function") {
    const retrievedInstance = await Sms.findByPk(smsId);
    if (!retrievedInstance) {
      console.error(`❌ Instance SMS introuvable pour ID: ${smsId}`);
      return {
        success: false,
        message: "Erreur interne: Instance SMS introuvable.",
      };
    }
    nouveauSmsInstance = retrievedInstance;
  }

  try {
    const totalDestinataires = destinataires.length;
    console.log(`📊 Total destinataires: ${totalDestinataires}`);

    // Vérification du quota
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

    // Notification début d'envoi
    io.emit("sms_envoi_debut", {
      smsId: nouveauSms.id,
      statut: "en_cours",
      totalDestinataires,
      progression: 0,
    });

    // Envoi en mode batch
    const batchSize = 10;
    let soumisCount = 0;
    let echecsInsertionCount = 0;

    for (let i = 0; i < destinataires.length; i += batchSize) {
      const batch = destinataires.slice(i, i + batchSize);
      
      console.log(`\n📦 Traitement batch ${Math.floor(i/batchSize) + 1}: ${batch.length} destinataires`);

      // Traiter chaque destinataire du batch
      for (const dest of batch) {
        console.log(`\n➡️  Traitement de ${dest.numero}`);
        console.log(`   Contenu: ${dest.contenu.substring(0, 50)}...`);

        try {
          // Insertion dans Outbox
          const outboxEntry = await Outbox.create({
            DestinationNumber: dest.numero,
            TextDecoded: dest.contenu,
            CreatorID: String(smsId),
            Coding: "Default_No_Compression",
            RelativeValidity: -1,
          });

          console.log(`   ✅ Inséré dans outbox (ID: ${outboxEntry.ID})`);
          soumisCount++;

          // Ajouter à la file de vérification asynchrone
          ajouterAFileVerification({
            numero: dest.numero,
            contenu: dest.contenu,
            creatorId: smsId,
            utilisateurId,
            smsInstance: nouveauSmsInstance,
          });

          console.log(`   ✅ Ajouté à la file de vérification`);

        } catch (error) {
          console.error(`   ❌ Échec insertion pour ${dest.numero}:`, error.message);
          echecsInsertionCount++;
        }
      }

      // Émettre la progression après chaque batch
      io.emit("sms_envoi_progression", {
        smsId: smsId,
        statut: "soumission_en_cours",
        soumis: soumisCount,
        echecs: echecsInsertionCount,
        total: totalDestinataires,
        progression: Math.round(((soumisCount + echecsInsertionCount) / totalDestinataires) * 100),
      });

      // Petit délai entre les batchs
      if (i + batchSize < destinataires.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`\n📊 Résumé soumission:`);
    console.log(`   Total: ${totalDestinataires}`);
    console.log(`   Soumis: ${soumisCount}`);
    console.log(`   Échecs insertion: ${echecsInsertionCount}`);

    // Mise à jour initiale du statut
    await nouveauSmsInstance.update({
      statut: "en_attente",
      dateEnvoi: new Date(),
      envoyes: 0,
      echecs: echecsInsertionCount,
    });

    return {
      success: true,
      message: `${soumisCount}/${totalDestinataires} SMS soumis à Gammu. Vérification en cours...`,
      data: {
        id: nouveauSmsInstance.id,
        statut: "en_attente",
        totalDestinataires,
        soumis: soumisCount,
        echecsInsertion: echecsInsertionCount,
      },
    };

  } catch (gammuError) {
    console.error("❌ Erreur globale d'insertion Outbox:", gammuError);
    
    if (nouveauSmsInstance) {
      try {
        await nouveauSmsInstance.update({ statut: "echec" });
      } catch (updateError) {
        console.error("❌ Erreur mise à jour statut:", updateError);
      }
    }

    return {
      success: false,
      message: "Échec de la soumission du SMS à Gammu (Erreur BDD Outbox).",
      error: gammuError.message,
      data: { id: smsId, statut: "echec" },
    };
  }
};
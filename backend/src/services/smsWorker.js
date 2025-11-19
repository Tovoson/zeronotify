import { io } from "../app.js";
import SentItems from "../models/gammu/sentitems.js";
import Outbox from "../models/gammu/outbox.js";
import Sms from "../models/sms.models.js";
import Utilisateur from "../models/utilisateur.models.js";

// File d'attente en mémoire
const fileVerification = [];
let workerActif = false;

// Statistiques par SMS
const statsParSms = new Map();

export const ajouterAFileVerification = (job) => {
  fileVerification.push({
    ...job,
    ajouteA: Date.now(),
    tentatives: 0,
  });

  // Initialiser les stats si nécessaire
  if (!statsParSms.has(job.creatorId)) {
    statsParSms.set(job.creatorId, {
      total: 0,
      envoyes: 0,
      echecs: 0,
    });
  }
  const stats = statsParSms.get(job.creatorId);
  stats.total++;

  // Démarrer le worker s'il n'est pas actif
  if (!workerActif) {
    demarrerWorker();
  }
};

export const demarrerWorker = async () => {
  if (workerActif) return;
  workerActif = true;

  console.log("🚀 Worker de vérification SMS démarré");

  while (fileVerification.length > 0 || workerActif) {
    if (fileVerification.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      if (fileVerification.length === 0 && statsParSms.size === 0) {
        workerActif = false;
        console.log("⏸️ Worker en pause");
        break;
      }
      continue;
    }

    const batch = fileVerification.splice(0, 20);
    
    await Promise.all(
      batch.map((job) => traiterVerification(job))
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const traiterVerification = async (job) => {
  const { numero, creatorId, utilisateurId, tentatives } = job;
  const maxTentatives = 15;

  try {
    const messageSentitems = await SentItems.findOne({
      where: {
        CreatorID: String(creatorId),
        DestinationNumber: numero,
      },
      order: [["ID", "DESC"]],
      attributes: ["Status", "SendingDateTime", "StatusError"],
    });

    if (messageSentitems) {
      await gererSucces(job, messageSentitems);
      return;
    }

    const messageOutbox = await Outbox.findOne({
      where: {
        CreatorID: String(creatorId),
        DestinationNumber: numero,
      },
    });

    console.log(`🔍 [${numero}] Tentative ${tentatives + 1}/${maxTentatives} - Outbox: ${!!messageOutbox}`);

    if (!messageOutbox && tentatives > 5) {
      await gererEchec(job, "disparu_sans_trace");
      return;
    }

    if (tentatives < maxTentatives) {
      fileVerification.push({
        ...job,
        tentatives: tentatives + 1,
      });
    } else {
      await gererEchec(job, "timeout");
    }
  } catch (error) {
    console.error(`❌ Erreur worker pour ${numero}:`, error.message);
    
    if (tentatives < maxTentatives) {
      fileVerification.push({
        ...job,
        tentatives: tentatives + 1,
      });
    } else {
      await gererEchec(job, "erreur_verification");
    }
  }
};

const gererSucces = async (job, messageSentitems) => {
  const { numero, creatorId, utilisateurId } = job;

  console.log(`✅ [${numero}] SMS confirmé envoyé`);

  await Utilisateur.decrement("messageRestant", {
    by: 1,
    where: { id: utilisateurId },
  });

  const stats = statsParSms.get(creatorId);
  if (stats) {
    stats.envoyes++;

    if (stats.envoyes + stats.echecs === stats.total) {
      await finaliserSms(creatorId, stats);
    } else {
      io.emit("sms_envoi_progression", {
        smsId: creatorId,
        statut: "en_cours",
        envoyes: stats.envoyes,
        echecs: stats.echecs,
        total: stats.total,
        progression: Math.round(((stats.envoyes + stats.echecs) / stats.total) * 100),
      });
    }
  }
};

const gererEchec = async (job, raison) => {
  const { numero, creatorId } = job;

  console.error(`❌ [${numero}] Échec: ${raison}`);

  const stats = statsParSms.get(creatorId);
  if (stats) {
    stats.echecs++;

    if (stats.envoyes + stats.echecs === stats.total) {
      await finaliserSms(creatorId, stats);
    }
  }
};

const finaliserSms = async (creatorId, stats) => {
  try {
    const smsInstance = await Sms.findByPk(creatorId);
    if (!smsInstance) return;

    const statutFinal = stats.echecs === stats.total ? "echec" : "envoye";

    await smsInstance.update({
      statut: statutFinal,
      envoyes: stats.envoyes,
      echecs: stats.echecs,
      dateEnvoi: new Date(),
    });

    console.log(`🏁 SMS ${creatorId} finalisé: ${stats.envoyes}/${stats.total} envoyés`);

    io.emit("sms_envoi_termine", {
      smsId: creatorId,
      statut: statutFinal,
      envoyes: stats.envoyes,
      echecs: stats.echecs,
      total: stats.total,
    });

    statsParSms.delete(creatorId);
  } catch (error) {
    console.error(`❌ Erreur finalisation:`, error.message);
  }
};

export const getStatutWorker = () => ({
  actif: workerActif,
  fileAttente: fileVerification.length,
  smsEnCours: Array.from(statsParSms.entries()).map(([id, stats]) => ({
    smsId: id,
    ...stats,
  })),
});
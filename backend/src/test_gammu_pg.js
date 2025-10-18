import Outbox from "./models/gammu/outbox.js"
import Inbox from "./models/gammu/inbox.js";
import SentItems from "./models/gammu/sentitems.js";
import Phones from "./models/gammu/phones.js";


const envoyerSMS = async (destinataire, message) => {
  try {
    const sms = await Outbox.create({
      DestinationNumber: destinataire,
      TextDecoded: message,
      CreatorID: 'MyApp',
      Coding: 'Default_No_Compression',
    });
    console.log(`SMS créé avec ID: ${sms.ID}`);
    return sms;
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    throw error;
  }
};

// Exemple 2: Récupérer les SMS reçus non traités


const getSMSNonTraites = async () => {
  try {
    const sms = await Inbox.findAll({
      where: { Processed: false },
      order: [['ReceivingDateTime', 'DESC']],
      limit: 50,
    });
    return sms;
  } catch (error) {
    console.error('Erreur récupération SMS:', error);
    throw error;
  }
};

// Exemple 3: Marquer un SMS comme traité
const marquerCommeTraite = async (smsId) => {
  try {
    await Inbox.update(
      { Processed: true },
      { where: { ID: smsId } }
    );
    console.log(`SMS ${smsId} marqué comme traité`);
  } catch (error) {
    console.error('Erreur marquage SMS:', error);
    throw error;
  }
};

// Exemple 4: Vérifier l'historique d'envoi


const getHistoriqueEnvois = async (destinataire = null, limit = 100) => {
  try {
    const where = destinataire ? { DestinationNumber: destinataire } : {};
    const historique = await SentItems.findAll({
      where,
      order: [['SendingDateTime', 'DESC']],
      limit,
    });
    return historique;
  } catch (error) {
    console.error('Erreur historique:', error);
    throw error;
  }
};

// Exemple 5: Obtenir les statistiques du modem


const getStatistiquesModem = async () => {
  try {
    const phones = await Phones.findAll();
    return phones.map(phone => ({
      imei: phone.IMEI,
      operateur: phone.NetName,
      signal: phone.Signal,
      batterie: phone.Battery,
      envoyes: phone.Sent,
      recus: phone.Received,
    }));
  } catch (error) {
    console.error('Erreur stats modem:', error);
    throw error;
  }
};

export {
  envoyerSMS,
  getSMSNonTraites,
  marquerCommeTraite,
  getHistoriqueEnvois,
  getStatistiquesModem,
};
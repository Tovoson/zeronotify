import Phones from '../models/gammu/phones.js';

/**
 * Vérifie le statut du modem en lisant la table 'phones' de Gammu.
 * @returns {object} Statut de l'opération.
 */
async function checkModemStatus() {
    try {
        // Interroge la table et trie par le dernier statut mis à jour (IMEI est la clé primaire ici)
        const phone = await Phones.findOne({ 
            // Trié par la dernière mise à jour de l'état
            order: [['UpdatedInDB', 'DESC']] 
        });

        if (!phone) {
            return {
                connected: false,
                message: "Aucun enregistrement de modem trouvé. Le service Gammu SMSD est-il démarré ?",
                status_code: 'NO_RECORD'
            };
        }

        const currentState = phone.State.toUpperCase(); // Assurer la comparaison majuscule
        
        // Les états acceptables pour l'envoi sont 'CONNECTED' ou 'SENDING'
        if (currentState === 'CONNECTED' || currentState === 'SENDING') {
            return {
                connected: true,
                message: `Modem opérationnel. État: ${phone.State}. Signal: ${phone.Signal}%`,
                status_code: phone.State
            };
        } else {
            // Statuts typiques d'erreur : ERROR, NOT CONNECTED, NONE, SEARCHING
            return {
                connected: false,
                message: `Modem indisponible ou en erreur. État actuel : ${phone.State}.`,
                status_code: phone.State
            };
        }
    } catch (error) {
        console.error("Erreur critique lors de l'interrogation du statut du modem:", error);
        return {
            connected: false,
            message: "Erreur de connexion à la table de statut Gammu.",
            status_code: 'DB_ERROR'
        };
    }
}

/**
 * Récupère les statistiques détaillées de tous les modems
 * @returns {Array} Liste des modems avec leurs statistiques
 */
async function getAllModemsStatus() {
    try {
        const phones = await Phones.findAll({
            order: [['UpdatedInDB', 'DESC']]
        });

        const now = new Date();

        return phones.map(phone => {
            const timeout = new Date(phone.TimeOut);
            const isActive = timeout > now;
            const lastUpdate = new Date(phone.UpdatedInDB);
            const minutesSinceUpdate = Math.floor((now - lastUpdate) / 1000 / 60);

            return {
                imei: phone.IMEI,
                imsi: phone.IMSI,
                operator: phone.NetName,
                networkCode: phone.NetCode,
                signal: phone.Signal,
                battery: phone.Battery,
                connected: isActive && minutesSinceUpdate < 2,
                sending: phone.Send,
                receiving: phone.Receive,
                sentCount: phone.Sent,
                receivedCount: phone.Received,
                lastUpdate: phone.UpdatedInDB,
                minutesSinceUpdate,
                client: phone.Client
            };
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des statuts des modems:", error);
        throw error;
    }
}

/**
 * Vérifie si le modem est prêt à envoyer des SMS
 * @returns {boolean} true si prêt, false sinon
 */
async function isModemReadyToSend() {
    const status = await checkModemStatus();
    return status.connected && status.data?.signal > 10; // Signal > 10% requis
}

export { getAllModemsStatus, isModemReadyToSend };
export default checkModemStatus;
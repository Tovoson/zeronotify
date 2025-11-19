import Outbox from "../models/gammu/outbox.js";
import SentItems from "../models/gammu/sentitems.js";

// 🔥 Fonction pour vérifier le statut d'envoi dans sentitems
export const verifierStatutEnvoi = async (
  numero,
  creatorId,
  maxTentatives = 5,
  intervalMs = 3000
) => {
  return new Promise(async (resolve) => {
    let tentatives = 0;

    const checkInterval = setInterval(async () => {
      tentatives++;

      try {
        // Vérifier dans sentitems si le message est envoyé
        const messageSentitems = await SentItems.findOne({
          where: {
            CreatorID: String(creatorId),
            DestinationNumber: numero,
          },
          order: [["ID", "DESC"]],
          attributes: [
            "Status",
            "SendingDateTime",
            "DeliveryDateTime",
            "StatusError",
          ],
        });

        if (messageSentitems) {
          // Message trouvé dans sentitems = envoyé avec succès
          clearInterval(checkInterval);
          console.log(
            `✅ Message trouvé dans sentitems pour ${numero}, Status: ${messageSentitems.Status}`
          );
          resolve({
            success: true,
            data: {
              status: messageSentitems.Status,
              sendingDateTime: messageSentitems.SendingDateTime,
              deliveryDateTime: messageSentitems.DeliveryDateTime,
              statusError: messageSentitems.StatusError,
            },
          });
          return;
        }

        // Vérifier si toujours dans outbox
        const messageOutbox = await Outbox.findOne({
          where: {
            CreatorID: String(creatorId),
            DestinationNumber: numero,
          },
          attributes: ["SendingTimeOut", "SendBefore"],
        });

        console.log(
          `🔍 Tentative ${tentatives}/${maxTentatives} pour ${numero} - Dans outbox: ${!!messageOutbox}`
        );

        // Si plus dans outbox ET pas dans sentitems après plusieurs tentatives = échec
        if (!messageOutbox && tentatives > 10) {
          clearInterval(checkInterval);
          console.error(`❌ Message disparu sans trace pour ${numero}`);
          resolve({ success: false, reason: "disparu_sans_trace" });
          return;
        }

        // Timeout atteint
        if (tentatives >= maxTentatives) {
          clearInterval(checkInterval);
          console.error(`⏰ Timeout atteint pour ${numero}`);
          resolve({ success: false, reason: "timeout" });
        }
      } catch (error) {
        console.error(
          `❌ Erreur vérification statut ${numero}:`,
          error.message
        );
      }
    }, intervalMs);
  });
};

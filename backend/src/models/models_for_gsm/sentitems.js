import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const SentItems = sequelize.define("SentItems", {
  ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // Numéro de téléphone du destinataire
    DestinationNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    // Contenu du message
    TextDecoded: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // ID du message envoyé par le SMSC (Centre de Service de Messages Courts)
    SMSCNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    // Le temps d'envoi réel
    SendingDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // L'ID du créateur (pour lier à votre campagne)
    CreatorID: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    // Identifiant de la table Outbox d'origine (utile pour le suivi)
    OriginalMessage: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'sentitems',
    timestamps: false,
});

export default SentItems;
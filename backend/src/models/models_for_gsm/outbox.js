import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Outbox = sequelize.define("outbox", {
  // Clé primaire (utilisée par Gammu pour le suivi)
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
    // Contenu du message (pour les messages courts/décodés)
    TextDecoded: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Encodage du message (souvent 'Default' ou 'Unicode')
    Coding: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'Default',
    },
    // État de l'envoi (0 = en attente, 1 = envoyé, 2 = échec)
    // Gammu gère cette colonne; votre application insère généralement sans la définir.
    SendingTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    // L'utilisateur/système qui a créé l'entrée (votre application Express)
    CreatorID: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Node.js',
    },
    // Optionnel: Date de planification d'envoi futur
    RelativeValidity: {
        type: DataTypes.INTEGER,
        defaultValue: -1, // -1 signifie envoyer immédiatement
    }
}, {
    // Nom de la table tel qu'il existe dans la base de données Gammu
    tableName: 'outbox', 
    timestamps: false, // Gammu gère ses propres timestamps
});

export default Outbox;
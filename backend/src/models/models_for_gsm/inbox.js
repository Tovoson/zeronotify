import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Inbox = sequelize.define("inbox", {
  ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // Numéro de l'expéditeur
    SenderNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    // Date/heure de réception par le modem
    ReceivingDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Contenu du message
    TextDecoded: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // ID du service (peut être utilisé pour catégoriser les messages)
    // Par exemple, pour stocker les accusés de solde reçus par l'opérateur.
    Processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }
}, {
    tableName: 'inbox',
    timestamps: false,
});

export default Inbox;
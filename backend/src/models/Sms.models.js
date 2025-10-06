import { sequelize } from "../config/database.js";
import { DataTypes } from "@sequelize/core";

const Sms = sequelize.define("Sms", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  expediteur: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "L'expéditeur ne peut pas être vide",
      },
    },
  },
  destinataire: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le destinataire ne peut pas être vide",
      },
    },
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le contenu ne peut pas être vide",
      },
    },
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "en_attente",
    validate: {
      isIn: {
        args: [["en_attente", "envoye", "delivre", "echec"]],
        msg: "Le statut doit être: en_attente, envoye, delivre ou echec",
      },
    },
  },
  dateEnvoi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
}, {
  tableName: "Sms",
  timestamps: true,
});

// Méthodes d'instance
// Sms.prototype.envoyer = function() {
//   this.statut = "envoye";
//   this.dateEnvoi = new Date();
//   return this.save();
// };

// MessageSMS.prototype.getStatut = function() {
//   return this.statut;
// };

// MessageSMS.prototype.historique = function() {
//   return {
//     id: this.id,
//     expediteur: this.expediteur,
//     destinataire: this.destinataire,
//     statut: this.statut,
//     dateEnvoi: this.dateEnvoi,
//     createdAt: this.createdAt,
//   };
// };

export default Sms;
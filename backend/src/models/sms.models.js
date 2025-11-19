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
  destinataires: {
    type: DataTypes.JSON, // Array de strings
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Les destinataires ne peuvent pas être vides",
      },
    },
  },
  contenu: {
    type: DataTypes.JSON,
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
        args: [["en_attente", "envoye", "planifie", "echec", "annule"]],
        msg: "Le statut doit être: en_attente, envoye, planifie ou echec",
      },
    },
  },
  dateEnvoi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  date_planifiee: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  envoyes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  echecs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "simple",
    validate: {
      isIn: {
        args: [["simple", "groupe", "planifie"]],
        msg: "Le type doit être: simple, groupe ou planifie",
      },
    },
  },
  isPlaned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  templateId: {
    type: DataTypes.INTEGER,
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

export default Sms;
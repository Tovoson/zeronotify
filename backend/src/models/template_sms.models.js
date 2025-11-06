import { sequelize } from "../config/database.js";
import { DataTypes } from "@sequelize/core";
import Utilisateur from "./utilisateur.models.js";

const TemplateSMS = sequelize.define("TemplateSMS", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  nomTemplate: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le nom ne peut pas être vide",
      },
    },
  },
  contenuTemplate: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le contenu ne peut pas être vide",
      },
    },
  },
  variablesTemplate: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  utilisationTemplate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  favoriTemplate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  categorieTemplate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Utilisateur,
      key: "id",
    },
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
});

export default TemplateSMS;
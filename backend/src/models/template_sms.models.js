import { sequelize } from "../config/database.js";
import { DataTypes } from "@sequelize/core";

const TemplateSMS = sequelize.define("TemplateSMS", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le nom ne peut pas être vide",
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
  variables: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
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
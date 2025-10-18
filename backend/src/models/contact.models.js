import { sequelize } from "../config/database.js";
import { DataTypes } from "@sequelize/core";
import Utilisateur from "./utilisateur.models.js";

const Contact = sequelize.define("Contact", {
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
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le téléphone ne peut pas être vide",
      },
    },
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

export default Contact;
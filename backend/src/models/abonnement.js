  import { sequelize } from "../config/database.js";
  import { DataTypes } from "@sequelize/core";

  const Abonnement = sequelize.define("Abonnement", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  quotaMessages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  messageUtilise: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  debutAbonnement: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      notEmpty: {
        msg: "La date de début d'abonnement ne peut pas être vide",
      },
    },
  },
  finAbonnement: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estActif: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  prixMensuel: {
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
});

export default Abonnement;
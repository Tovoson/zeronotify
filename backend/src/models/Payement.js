  import { sequelize } from "../config/database.js";
  import { DataTypes } from "@sequelize/core";
import Abonnement from "./abonnement.js";
import Utilisateur from "./utilisateur.models.js";

  const Payement = sequelize.define("Payement", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  methodePayement: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Mvola",
  },

  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le champ transactionId ne peut pas être vide",
      },
    },
  },
  finAbonnement: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "en attente",
  },
  utilisateurId: {
     type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Utilisateur,
      key: "id",
    },
  },
  abonnementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Abonnement,
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

export default Payement;
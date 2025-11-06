  import { sequelize } from "../config/database.js";
  import { DataTypes } from "@sequelize/core";
import Abonnement from "./abonnement.js";

  const Utilisateur = sequelize.define("Utilisateur", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: "Cet email est déjà utilisé",
    },
    validate: {
      notEmpty: {
        msg: "L'email ne peut pas être vide",
      },
      isEmail: {
        msg: "L'adresse email n'est pas valide",
      },
    },
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le mot de passe ne peut pas être vide",
      },
      len: {
        args: [8, 255],
        msg: "Le mot de passe doit contenir au moins 8 caractères",
      },
    },
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
  entreprise: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statut: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  messageRestant: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 10
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

export default Utilisateur;
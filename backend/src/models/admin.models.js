  import { sequelize } from "../config/database.js";
  import { DataTypes } from "@sequelize/core";

  const Admin = sequelize.define("Admin", {
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
        len: {
          args: [2, 100],
          msg: "Le nom doit contenir entre 2 et 100 caractères",
        },
      },
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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    entreprise: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "L'entreprise ne peut pas être vide",
        },
        len: {
          args: [2, 150],
          msg: "Le nom de l'entreprise doit contenir entre 2 et 150 caractères",
        },
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

  // Hook pour hasher le mot de passe avant création
  // Admin.beforeCreate(async (admin) => {
  //   if (admin.mot_de_passe) {
  //     admin.mot_de_passe = await bcrypt.hash(admin.mot_de_passe, 10);
  //   }
  // });

  // Hook pour hasher le mot de passe avant mise à jour
  // Admin.beforeUpdate(async (admin) => {
  //   if (admin.changed('mot_de_passe')) {
  //     admin.mot_de_passe = await bcrypt.hash(admin.mot_de_passe, 10);
  //   }
  // });

  // Méthode pour vérifier le mot de passe
  // Admin.prototype.verifierMotDePasse = async function(motDePasse) {
  //   return await bcrypt.compare(motDePasse, this.mot_de_passe);
  // };

  export default Admin;

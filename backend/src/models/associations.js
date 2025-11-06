import Abonnement from "./abonnement.js";
import Contact from "./contact.models.js";
import Payement from "./Payement.js";
import Sms from "./sms.models.js";
import TemplateSMS from "./template_sms.models.js";
import Utilisateur from "./utilisateur.models.js";

// ========== Utilisateur <-> Contact (1 à n) ==========
Utilisateur.hasMany(Contact, {
  foreignKey: {
    name: "utilisateur_id",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "contacts",
});

// ========== Utilisateur <-> TemplateSMS (0 à n) ==========
Utilisateur.hasMany(TemplateSMS, {
  foreignKey: {
    name: "utilisateur_id",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "templates",
});

Utilisateur.hasMany(Payement, {
  foreignKey: {
    name: "utilisateur_id",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "payements",
});

Abonnement.hasMany(Payement, {
  foreignKey: {
    name: "abonnement_id",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "payements",
});

Utilisateur.belongsTo(Abonnement, {
  foreignKey: {
    name: "abonnementId",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "utilisateur_abonnement",
});

// ========== Utilisateur <-> Sms (0 à n) ==========
Utilisateur.hasMany(Sms, {
  foreignKey: {
    name: "utilisateur_id",
    allowNull: false,
    onDelete: "CASCADE",
  },
  as: "envois",
});

// ========== Contact <-> Sms (0 à n) ==========
Contact.hasMany(Sms, {
  foreignKey: {
    name: "contact_id",
    allowNull: true,
    onDelete: "SET NULL",
  },
  as: "envois",
});

export { Utilisateur, Contact, TemplateSMS, Sms, Payement, Abonnement };
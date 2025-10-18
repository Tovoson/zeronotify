import { sequelize } from "./database.js";
import { Utilisateur, Contact, TemplateSMS, Sms } from "../models/associations.js";

const syncDatabase = async () => {
  try {
    // Option 1: Synchroniser sans supprimer les tables existantes
    //await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée avec succès");

    // Option 2: Pour le développement - réinitialise toutes les tables
     await sequelize.sync({ force: false });
    // console.log("Base de données réinitialisée avec succès");
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
  }
};

export default syncDatabase;
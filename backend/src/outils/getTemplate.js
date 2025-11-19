import TemplateSMS from "../models/template_sms.models.js";
import { validerTableauPhones } from "./validateur.js";

export const getTemplateFonc = async (id) => {
  const template = await TemplateSMS.findByPk(id);
  if (!template) {
    return {
      status: "fail",
      message: "Template not found",
    };
  }

  return {
    status: "success",
    data: template,
  };
};

export const extraireVariablesTemplate = (template) => {
  const regex = /{(\w+)}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }

  return variables;
};

export const remplirTemplate = (template, donnees) => {
  let message = template;

  // Remplacer chaque {variable} par sa valeur
  Object.keys(donnees).forEach((key) => {
    const regex = new RegExp(`{${key}}`, "g");
    message = message.replace(regex, donnees[key] || "");
  });

  return message;
};

// 3. Préparer les SMS pour plusieurs destinataires
export const preparerSMS = (template, destinataires) => {
  const resultats = {
    messages: [],
    erreurs: [],
    total: destinataires.length,
  };

  const num = []

  destinataires.forEach((dest) => {
    // Vérifier que le destinataire a un numéro
    if (!dest.numero) {
      resultats.erreurs.push({
        destinataire: dest,
        raison: "Numéro manquant",
      });
      return;
    }

    // Générer le message personnalisé
    const message = remplirTemplate(template, dest);

    

    resultats.messages.push({
      //numero: dest.numero,
      message: message,
      donnees: dest,
    });

    num.push(dest.numero)

  });

  const resultatPhone = validerTableauPhones(num);
    if (!resultatPhone.success) {
      return ({
        success: false,
        message: "Certains numéros de téléphone sont invalides",
        details: resultatPhone,
      });
    }

  return {
    ...resultats,
    resultatPhone,
    success: resultats.erreurs.length === 0,
    resume: `${resultats.messages.length}/${resultats.total} messages préparés`,
  };
};

export const validerDonnees = (destinataires, variablesRequises) => {

  const erreurs = [];
  
  destinataires.forEach((dest, index) => {
    const champManquants = variablesRequises.filter(
      variable => !dest[variable] || dest[variable].trim() === ''
    );
    
    if (champManquants.length > 0) {
      erreurs.push({
        index: index,
        numero: dest.numero,
        champsManquants: champManquants,
      });
    }
  });
  
  return {
    valide: erreurs.length === 0,
    erreurs: erreurs,
    variablesRequises: variablesRequises,
  };
};



export const teste = () => {
  const destinataires = [
  { numero: "0341234567", nom: "Rakoto", lieu: "Antananarivo" },
  { numero: "0321234567", nom: "Rabe", lieu: "Toamasina" },
  { numero: "0331234567", nom: "Rasoa", lieu: "Antsirabe" },
  { numero: "0381234567", nom: "Jean", lieu: "" }, // Lieu manquant
  { numero: "", nom: "Pierre", lieu: "Fianarantsoa" }, // Numéro manquant
];

const template = "Bonjour {nom}, votre colis est à {lieu}";

console.log("\n📊 Destinataires:", destinataires.length);


const validation = validerDonnees(template, destinataires);
console.log("✅ Données valides:", validation.valide);
console.log("❌ Erreurs de données:", validation.erreurs);

console.log(preparerSMS(template, destinataires));
console.log(validation.variablesRequises);
}
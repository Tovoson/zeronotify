export const validerPhone = (destinataire) => {
    const phoneRegex = /^\+261[0-9]{9}$/;

    if (!phoneRegex.test(destinataire)) {
      return {
        success: false,
        message:
          "Le numéro de téléphone doit être au format (+261XXXXXXXXX)",
        example: "+26134XXXXXXX",
      };
    }

    return { success: true };
};

export const validerSms = (expediteur, destinataire, contenu) => {
  if (!expediteur || !destinataire || !contenu) {
    return {
      success: false,
      message:
        "Les champs expediteur, destinataire et contenu sont obligatoires",
      errors: {
        expediteur: !expediteur ? "L'expéditeur est requis" : null,
        destinataire: !destinataire ? "Le destinataire est requis" : null,
        contenu: !contenu ? "Le contenu est requis" : null,
      },
    };
  }

  return { success: true };
};

export const validerDatesPlanification = (datePlanifiee) => {
  if (datePlanifiee) {
    const date = new Date(datePlanifiee);
    const maintenant = new Date();

    if (isNaN(date.getTime())) {
      return {
        success: false,
        message: "La date de planification est invalide. Utilisez le format ISO 8601",
        example: "2023-12-31T15:30:00Z",
      };
    }

    if (date <= maintenant) {
      return {
        success: false,
        message:
          "La date de planification doit être une date future",
        details: {
          date_recue: datePlanifiee,
          date_actuelle: maintenant.toISOString()
        }
      };
    }
  }

  return { success: true };
};
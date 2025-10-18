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

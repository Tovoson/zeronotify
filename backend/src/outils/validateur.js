const validerPhone = (destinataire) => {
  // Nettoyer le numéro (enlever espaces)
  let numCleaned = String(destinataire).trim();
  
  // Vérifier si vide
  if (!numCleaned || numCleaned.length === 0) {
    return {
      success: false,
      message: "Le numéro ne peut pas être vide",
    };
  }

  if (/^(3[234]|38)\d{7}$/.test(numCleaned)) {
    numCleaned = "0" + numCleaned; // Ajouter le 0 manquant
  }

  if (/^261(3[234]|38)\d{7}$/.test(numCleaned)) {
    numCleaned = "+" + numCleaned;
  }

  // Format international : +261XXXXXXXXX (9 chiffres après +261)
  const regexInternational = /^\+261(3[234]|38)\d{7}$/;
  
  // Format local : 03X XXXXXXX (10 chiffres commençant par 03)
  const regexLocal = /^0(3[234]|38)\d{7}$/;

  const isValid = regexInternational.test(numCleaned) || regexLocal.test(numCleaned);

  if (!isValid) {
    return {
      success: false,
      message: "Format invalide. Utilisez +261XXXXXXXXX ou 03XXXXXXXX",
      example: "+26134XXXXXXX ou 0341234567",
      numero: destinataire,
    };
  }

  return { 
    success: true,
    numero: numCleaned,
  };
};

export const validerTableauPhones = (destinataires) => {
  const resultats = {
    valides: [],
    invalides: [],
    total: destinataires.length,
  };

  destinataires.forEach((dest) => {
    const validation = validerPhone(dest);
    
    if (validation.success) {
      resultats.valides.push(validation.numero);
    } else {
      resultats.invalides.push({
        numero: dest,
        raison: validation.message,
      });
    }
  });

  return {
    ...resultats,
    success: resultats.invalides.length === 0,
    message: `${resultats.valides.length}/${resultats.total} numéros valides`,
  };
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

export const verifierQuotaSms = (quotaActuel, nombreSmsAAjouter) => {

  if (nombreSmsAAjouter > quotaActuel) {
    return {
      success: false,
      message: "Quota SMS dépassé",
      details: {
        quota_actuel: quotaActuel,
        sms_a_ajouter: nombreSmsAAjouter
      }
    };
  }

  return { success: true };
};

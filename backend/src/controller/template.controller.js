import TemplateSMS from "../models/template_sms.models";

export const creerTemplate = async (req, res) => {
  try {
    const { nom, contenu, variables, utilisateurId } = req.body;

    // Validation des champs
    if (!nom || !contenu || !utilisateurId) {
      return res.status(400).json({
        status: "fail",
        message: "Le nom, le contenu et l'utilisateur sont requis",
      });
    }

    // Création du template
    const newTemplate = await TemplateSMS.create({
      nom,
      contenu,
      variables: variables || [], // Utiliser un tableau vide par défaut
      utilisateur_id: utilisateurId,
    });

    return res.status(201).json({
      status: "success",
      message: "Template created successfully",
      data: newTemplate,
    });
  } catch (error) {
    console.error("Erreur lors de la création du template:", error);
    return res.status(500).json({
      status: "error",
      message: "La création du template a échoué",
      error: error.message,
    });
  }
};

export const listerTemplates = async (req, res) => {
    const utilisateurId = req.params.id;
  try {
    const templates = await TemplateSMS.findAll({where: { utilisateur_id: utilisateurId }});
    res.status(200).json({
      status: "success",
      data: templates,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des templates:", error);
    return res.status(500).json({
      status: "error",
      message: "La récupération des templates a échoué",
      error: error.message,
    });
  }
};

export const getTemplateById = (req, res) => {
  const { id } = req.params;
  // Logic to get a template by ID
  res.status(200).json({
    status: "success",
    data: {}, // Replace with actual template data
  });
};

export const mettreAJourTemplate = (req, res) => {
  const { id } = req.params;
  // Logic to update a template by ID
  res.status(200).json({
    status: "success",
    message: "Template updated successfully",
  });
};

export const supprimerTemplate = (req, res) => {
  const { id } = req.params;
  // Logic to delete a template by ID
  res.status(204).json({
    status: "success",
    message: "Template deleted successfully",
  });
};
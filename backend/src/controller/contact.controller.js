import Contact from "../models/contact.models.js";

export const creerContact = async (req, res) => {
  try {
    const { nom, numero, utilisateurId } = req.body;

    // Validation des champs
    if (!nom || !numero || !utilisateurId) {
      return res.status(400).json({
        status: "fail",
        message: "Tous les champs sont requis",
      });
    }

    // Création du contact
    const contact = await Contact.bulkCreate([{
      nom: nom,
      telephone: numero,
      utilisateur_id: utilisateurId,
    }]);

    const message = "Contact créé avec succès";
    return res.status(201).json({ message, data: contact });
  } catch (error) {
    // Gestion des erreurs de validation
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: error.errors.map((e) => e.message),
      });
    }

    // Erreur générale
    console.error("Erreur lors de la création du contact:", error);
    return res.status(500).json({
      message: "Le contact n'a pas pu être créé, réessayez dans un instant",
      error: error.message,
    });
  }
};

export const listerContacts = async (req, res) => {

    const { id } = req.params; //id utilisateur connecté
  try {
    const contacts = await Contact.findAll({where: {utilisateur_id: id}});
    return res.status(200).json({ data: contacts });
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts:", error);
    return res.status(500).json({
      message: "Impossible de récupérer les contacts, réessayez dans un instant",
      error: error.message,
    });
  }
};
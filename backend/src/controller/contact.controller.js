import Contact from "../models/contact.models.js";

export const creerCampagneContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    const utilisateurId = req.user.userId;
    // Validation des champs
    if (
      !contacts ||
      !Array.isArray(contacts) ||
      contacts.length === 0

    ) {
      return res.status(400).json({
        status: "fail",
        message:
          "Tous les champs sont requis et contacts doit être un tableau non vide",
      });
    }

    // Préparation des données pour bulkCreate
    const contactsData = contacts.map((contact) => ({
      nom: contact.nom,
      telephone: contact.numero,
      groupe: contact.groupe,
      utilisateur_id: utilisateurId,
    }));

    // Création des contacts en masse
    const createdContacts = await Contact.bulkCreate(contactsData);

    const message = "Campagne de contacts créée avec succès";
    return res.status(201).json({ message, data: createdContacts });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la campagne de contacts:",
      error
    );
    return res.status(500).json({
      message:
        "La campagne de contacts n'a pas pu être créée, réessayez dans un instant",
      error: error.message,
    });
  }
};

export const listerContacts = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      message: "Utilisateur non authentifié",
    });
  }

  const id = req.user.userId;
  try {
    const contacts = await Contact.findAll({ where: { utilisateur_id: id } });
    return res.status(200).json({ data: contacts });
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts:", error);
    return res.status(500).json({
      message:
        "Impossible de récupérer les contacts, réessayez dans un instant",
      error: error.message,
    });
  }
};

export const supprimerContact = async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        message: "contact non trouvé",
      });
    }

    await Contact.destroy({
      where: { id: id },
    });

    return res
      .status(200)
      .json({ message: "Contact supprimé avec succès", data: contact });
  } catch (error) {
    console.error("Erreur lors de la suppression du contact:", error);
    return res.status(500).json({
      message: "Impossible de supprimer le contact, réessayez dans un instant",
      error: error.message,
    });
  }
};

export const modifierContact = async (req, res) => {
  const { id } = req.params;
  const { nom, numero, groupe } = req.body;

  console.log(req.body);

  try {
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        message: "contact non trouvé",
      });
    }

    const response = await Contact.update(
      {
        nom,
        telephone: numero,
        groupe,
      },
      {
        where: { id, id },
        returning: true,
      }
    );

    return res.status(200).json({
      message: "Contact modifié avec succès",
      data: response,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du contact:", error);
    return res.status(500).json({
      message: "Impossible de modifier le contact, réessayez dans un instant",
      error: error.message,
    });
  }
};

export const getContactById = async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        message: "contact non trouvé",
      });
    }

    return res.status(200).json({
      message: "Contact trouvé avec succès",
      data: contact,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du contact:", error);
    return res.status(500).json({
      message: "Impossible de modifier le contact, réessayez dans un instant",
      error: error.message,
    });
  }
};

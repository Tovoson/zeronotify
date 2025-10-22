import Contact from "../models/contact.models.js";

export const creerCampagneContacts = async (req, res) => {
    try {
      const { contacts, utilisateurId } = req.body;
  
      // Validation des champs
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0 || !utilisateurId) {
        return res.status(400).json({
          status: "fail",
          message: "Tous les champs sont requis et contacts doit être un tableau non vide",
        });
      }
  
      // Préparation des données pour bulkCreate
      const contactsData = contacts.map(contact => ({
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
      console.error("Erreur lors de la création de la campagne de contacts:", error);
      return res.status(500).json({
        message: "La campagne de contacts n'a pas pu être créée, réessayez dans un instant",
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
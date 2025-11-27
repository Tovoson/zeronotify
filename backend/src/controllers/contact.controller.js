import Contact from "../models/contact.models.js";

/**
 * @swagger
 * /zeronotify/contact/creer-campagne-contacts:
 *   post:
 *     summary: Créer une campagne de contacts
 *     description: Crée plusieurs contacts en masse
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contacts
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nom
 *                     - numero
 *                     - groupe
 *                   properties:
 *                     nom:
 *                       type: string
 *                       example: Jean Dupont
 *                     numero:
 *                       type: string
 *                       example: "+261340000000"
 *                     groupe:
 *                       type: string
 *                       example: Clients
 *           example:
 *             contacts:
 *               - nom: Jean Dupont
 *                 numero: "+261340000000"
 *                 groupe: Clients
 *               - nom: Marie Martin
 *                 numero: "+261340000001"
 *                 groupe: Partenaires
 *     responses:
 *       201:
 *         description: Campagne de contacts créée avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @swagger
 * /zeronotify/contact/lister-contacts:
 *   get:
 *     summary: Récupérer tous les contacts de l'utilisateur
 *     description: Retourne la liste des contacts de l'utilisateur authentifié
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des contacts récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Utilisateur non authentifié
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @swagger
 * /zeronotify/contact/supprimer-contact/{id}:
 *   delete:
 *     summary: Supprimer un contact
 *     description: Supprime un contact par son ID
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du contact à supprimer
 *     responses:
 *       200:
 *         description: Contact supprimé avec succès
 *       404:
 *         description: Contact non trouvé
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @swagger
 * /zeronotify/contact/modifier-contact/{id}:
 *   put:
 *     summary: Modifier un contact
 *     description: Met à jour les informations d'un contact existant
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du contact à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - numero
 *               - groupe
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Jean Dupont
 *               numero:
 *                 type: string
 *                 example: "+261340000000"
 *               groupe:
 *                 type: string
 *                 example: Clients
 *     responses:
 *       200:
 *         description: Contact modifié avec succès
 *       404:
 *         description: Contact non trouvé
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @swagger
 * /zeronotify/contact/listerByPk/{id}:
 *   get:
 *     summary: Récupérer un contact par ID
 *     description: Retourne les informations d'un contact spécifique
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du contact à récupérer
 *     responses:
 *       200:
 *         description: Contact trouvé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Contact non trouvé
 *       500:
 *         description: Erreur serveur
 */
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

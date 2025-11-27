import TemplateSMS from "../models/template_sms.models.js";
import { getTemplateFonc } from "../outils/getTemplate.js";

/**
 * @swagger
 * /zeronotify/template/creer-template:
 *   post:
 *     summary: Créer un nouveau template SMS
 *     description: Crée un template SMS personnalisé avec des variables optionnelles
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomTemplate
 *               - contenuTemplate
 *             properties:
 *               nomTemplate:
 *                 type: string
 *                 example: Bienvenue Client
 *               contenuTemplate:
 *                 type: string
 *                 example: Bonjour {nom}, bienvenue chez {entreprise}!
 *               variablesTemplate:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nom", "entreprise"]
 *               categorieTemplate:
 *                 type: string
 *                 example: Marketing
 *     responses:
 *       201:
 *         description: Template créé avec succès
 *       400:
 *         description: Champs requis manquants
 *       500:
 *         description: Erreur serveur
 */
export const creerTemplate = async (req, res) => {
  try {
    const { nomTemplate, contenuTemplate, variablesTemplate, categorieTemplate } = req.body;
    const utilisateurId = req.user.userId;

    console.log("Données reçues pour la création du template:", req.body); // Debug

    // Validation des champs
    if (!nomTemplate || !contenuTemplate || !utilisateurId) {
      return res.status(400).json({
        status: "fail",
        message: "Le nom, le contenu et l'utilisateur sont requis",
      });
    }
    
    // Création du template
    const newTemplate = await TemplateSMS.create({
      nomTemplate: nomTemplate,
      contenuTemplate: contenuTemplate,
      variablesTemplate: variablesTemplate || [], // Utiliser un tableau vide par défaut
      utilisateur_id: utilisateurId,
      categorieTemplate: categorieTemplate || null,
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

/**
 * @swagger
 * /zeronotify/template/lister-templates:
 *   get:
 *     summary: Lister tous les templates de l'utilisateur
 *     description: Récupère tous les templates SMS créés par l'utilisateur authentifié
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des templates récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Erreur serveur
 */
export const listerTemplates = async (req, res) => {
    const utilisateurId = req.user.userId;

    console.log("Utilisateur ID pour lister les templates:", utilisateurId); // Debug
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

/**
 * @swagger
 * /zeronotify/template/template/{id}:
 *   get:
 *     summary: Récupérer un template par ID
 *     description: Retourne les détails d'un template SMS spécifique
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template à récupérer
 *     responses:
 *       200:
 *         description: Template trouvé avec succès
 *       404:
 *         description: Template non trouvé
 *       500:
 *         description: Erreur serveur
 *   put:
 *     summary: Mettre à jour un template
 *     description: Modifie les informations d'un template SMS existant
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomTemplate:
 *                 type: string
 *                 example: Bienvenue Client V2
 *               contenuTemplate:
 *                 type: string
 *                 example: Salut {nom}, ravi de vous revoir!
 *               variablesTemplate:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nom"]
 *               categorieTemplate:
 *                 type: string
 *                 example: Relation Client
 *     responses:
 *       200:
 *         description: Template modifié avec succès
 *       404:
 *         description: Template non trouvé
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer un template
 *     description: Supprime définitivement un template SMS
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du template à supprimer
 *     responses:
 *       200:
 *         description: Template supprimé avec succès
 *       404:
 *         description: Template non trouvé
 *       500:
 *         description: Erreur serveur
 */
export const getTemplateById = async(req, res) => {
  const { id } = req.params;

  const result = await getTemplateFonc(id);
  if (result.status === "fail") {
    return res.status(404).json(result);
  }

  res.status(200).json(result);
};

export const mettreAJourTemplate = (req, res) => {
  const { id } = req.params;
  // Logic to update a template by ID
  res.status(200).json({
    status: "success",
    message: "Api en cours de construction",
  });
};

export const supprimerTemplate = (req, res) => {
  const { id } = req.params;
  // Logic to delete a template by ID
  res.status(204).json({
    status: "success",
    message: "Api en cours de construction",
  });
};
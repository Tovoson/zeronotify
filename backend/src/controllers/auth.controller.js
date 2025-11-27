import bcrypt from "bcrypt";
import { ValidationError, UniqueConstraintError } from "@sequelize/core";
import Utilisateur from "../models/utilisateur.models.js";
import jwt from "jsonwebtoken";
import { key_jwt } from "../lib/key_jwt.js";
import Abonnement from "../models/abonnement.js";

/**
 * @swagger
 * /zeronotify/auth/signup:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     description: Inscription d'un nouvel utilisateur avec création automatique d'un abonnement
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - email
 *               - mot_de_passe
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: MonMotDePasse123
 *               entreprise:
 *                 type: string
 *                 example: Ma Société SARL
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Erreur de validation ou email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
const signUp = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, entreprise } = req.body;

    // Validation des champs
    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({
        status: "fail",
        message: "Tous les champs sont requis",
      });
    }

    const abonnement = await Abonnement.create({
      quotaMessages: 10,
      messageUtilise: 0,
    });

    // Hashage du mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Création de l'utilisateur
    const user = await Utilisateur.create({
      nom: nom,
      email: email,
      mot_de_passe: hash,
      entreprise: entreprise,
      abonnementId: abonnement.id,
    });

    const message = "Utilisateur créé avec succès";
    return res.status(201).json({ message, data: user });
  } catch (error) {
    // Gestion des erreurs de validation
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: error.errors.map((e) => e.message),
      });
    }

    // Gestion des erreurs d'unicité (email déjà existant)
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé",
        error: error.message,
      });
    }

    // Erreur générale
    console.error("Erreur lors de la création:", error);
    return res.status(500).json({
      message: "L'utilisateur n'a pas pu être créé, réessayez dans un instant",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /zeronotify/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT valide 24h
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - mot_de_passe
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: MonMotDePasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateur connecté avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nom:
 *                       type: string
 *                     email:
 *                       type: string
 *                     entreprise:
 *                       type: string
 *                     active:
 *                       type: boolean
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Champs manquants
 *       401:
 *         description: Mot de passe incorrect
 *       404:
 *         description: Email n'existe pas
 *       500:
 *         description: Erreur serveur
 */
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Validation des champs
    if (!email || !mot_de_passe) {
      return res.status(400).json({
        status: "fail",
        message: "Tous les champs sont requis",
      });
    }

    // Recherche de l'utilisateur
    const user = await Utilisateur.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).json({
        message: "Email n'existe pas",
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Mot de passe ou email incorrect",
      });
    }

    // Vérification si le compte est actif, il faut encore ajouter une table status dans utiliser
    /**
    if (!user.active) {
      return res.status(403).json({
        message: "Compte désactivé",
      });
    }
    */

    // Génération du token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: "admin",
      },
      key_jwt,
      { expiresIn: "24h" }
    );

    console.log('Token généré:', token) // Debug
    console.log('Payload:', jwt.decode(token))

    const message = "Utilisateur connecté avec succès";
    return res.json({
      message,
      data: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        entreprise: user.entreprise,
        active: user.active,
      },
      token,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return res.status(500).json({
      message: "L'utilisateur n'a pas pu être connecté, réessayez plus tard",
      error: error.message,
    });
  }
};

export { signUp, login };

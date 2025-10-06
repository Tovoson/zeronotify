import bcrypt from "bcrypt";
import { ValidationError, UniqueConstraintError } from "@sequelize/core";
import Admin from "../models/admin.models.js";
import jwt from "jsonwebtoken";
import { key_jwt } from "../lib/key_jwt.js";

const signUp = async (req, res) => {
  try {
    const { nom, email, password, entreprise } = req.body;

    // Validation des champs
    if (!nom || !email || !password || !entreprise) {
      return res.status(400).json({
        status: "fail",
        message: "Tous les champs sont requis",
      });
    }

    // Hashage du mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const user = await Admin.create({
      nom: nom,
      email: email,
      mot_de_passe: hash,
      entreprise: entreprise,
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Tous les champs sont requis",
      });
    }

    // Recherche de l'utilisateur
    const user = await Admin.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).json({
        message: "Email n'existe pas",
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Mot de passe ou email incorrect",
      });
    }

    // Vérification si le compte est actif
    if (!user.active) {
      return res.status(403).json({
        message: "Compte désactivé",
      });
    }

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

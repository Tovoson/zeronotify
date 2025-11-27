import Contact from "../models/contact.models.js";
import Sms from "../models/sms.models.js";
import TemplateSMS from "../models/template_sms.models.js";
import Utilisateur from "../models/utilisateur.models.js";

export const exempleUtilisation = async () => {
  // Créer un utilisateur avec ses contacts
  const utilisateur = await Utilisateur.create({
    email: "user@example.com",
    mot_de_passe: "password123",
    nom: "Jean Dupont",
    entreprise: "Ma Société",
  });

  // Créer plusieurs contacts pour cet utilisateur avec bulkCreate
  const contacts = await Contact.bulkCreate([
    {
      nom: "Contact 1",
      telephone: "+261340000001",
      utilisateur_id: utilisateur.id,
    },
    {
      nom: "Contact 2",
      telephone: "+261340000002",
      utilisateur_id: utilisateur.id,
    }
  ]);

  // OU créer un seul contact à la fois
  // const contact1 = await Contact.create({
  //   nom: "Contact 1",
  //   telephone: "+261340000001",
  //   admin_id: utilisateur.id,
  // });

  // Créer un template
  await TemplateSMS.create({
    nom: "Bienvenue",
    contenu: "Bonjour {nom}, bienvenue !",
    variables: ["nom"],
    utilisateur_id: utilisateur.id,
  });

  // Méthode 1: Extraire automatiquement tous les numéros de téléphone
  const destinataires = contacts.map(contact => contact.telephone);
  
  // Créer un envoi SMS groupé (pour tous les contacts)
  await Sms.create({
    expediteur: "MonEntreprise",
    destinataires: destinataires, // Tous les numéros automatiquement
    contenu: "Message de test",
    total: destinataires.length, // Nombre automatique
    utilisateur_id: utilisateur.id,
    contact_id: null, // null pour un envoi groupé
    type: "groupe"
  });

  // Méthode 2: Créer un envoi SMS individuel pour CHAQUE contact
  const envoiIndividuels = contacts.map(contact => ({
    expediteur: "MonEntreprise",
    destinataires: [contact.telephone],
    contenu: `Bonjour ${contact.nom}, message personnalisé`,
    total: 1,
    utilisateur_id: utilisateur.id,
    contact_id: contact.id,
    type: "simple"
  }));
  
  await Sms.bulkCreate(envoiIndividuels);

  // Méthode 3: Récupérer les contacts depuis la base de données
  // const contactsFromDB = await Contact.findAll({
  //   where: { admin_id: utilisateur.id }
  // });
  // const destinataires = contactsFromDB.map(c => c.telephone);

  // Récupérer un utilisateur avec ses relations
  const userAvecRelations = await Utilisateur.findByPk(utilisateur.id, {
    include: [
      { model: Contact, as: "contacts" },
      { model: TemplateSMS, as: "templates" },
      { 
        model: Sms, 
        as: "envois",
        include: [
          { model: Contact, as: "contact" } // Inclure le contact associé à chaque envoi
        ]
      },
    ],
  });

  console.log(JSON.stringify(userAvecRelations, null, 2));
};
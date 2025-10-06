import Admin from '../models/admin.js';

const signUp = (req, res, next) => {
    const body = req.body;

    if (!['1', '2'].includes(body.nom)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Nom non valide'
        })
    }

    const newAdmin = Admin.create({
        nom: body.nom,
        email: body.email,
        mot_de_passe: body.mot_de_passe,
        entreprise: body.entreprise
    });

    if(!newAdmin) {
        return res.status(400).json({
            status: 'fail',
            message: 'Erreur de création du compte'
        })
    }

    return res.status(201).json({
        status: 'success',
        data: newAdmin
    })
};

export { signUp };
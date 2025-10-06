import jwt from 'jsonwebtoken'
import { key_jwt } from '../lib/key_jwt.js'

export const protectAPI_via_Middleware_token = (req, res, next) => {
    const authorizationHeader = req.headers.authorization

    if(!authorizationHeader){
        const message = "Vous n'avez pas fourni un jeton d'auth, ajoutez en un dans l'entête de la requête"
        return res.status(401).json({message})
    }

    const token = authorizationHeader.split(' ')[1]
    const decodedToken = jwt.verify(token, key_jwt, (error, decodedToken) =>{
        if(error){
            const message = "L'utilisateur n'est pas autorisé à accéder à cette ressource"
            return res.status(401).json({message})
        }

        const userId = decodedToken.userId
        if(req.body.userId && req.body.userId !== userId){
            const message = "L'idéntifiant de l'utilisateur est invalide"
            return res.status(401).json({message})
        }

        next()
    })
}
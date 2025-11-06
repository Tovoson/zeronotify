import jwt from 'jsonwebtoken'
import { key_jwt } from '../lib/key_jwt.js'

export const protectAPI_via_Middleware_token = (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization
        
        console.log('🔐 Auth Header:', authorizationHeader) // Debug

        if(!authorizationHeader){
            const message = "Vous n'avez pas fourni un jeton d'auth, ajoutez en un dans l'entête de la requête"
            return res.status(401).json({message})
        }

        const token = authorizationHeader.split(' ')[1]
        console.log('🎫 Token reçu:', token?.substring(0, 20) + '...') // Debug
        
        if(!token){
            const message = "Format du token invalide. Utilisez: Bearer <token>"
            return res.status(401).json({message})
        }

        // VERSION SYNCHRONE au lieu d'async avec callback
        const decodedToken = jwt.verify(token, key_jwt)
        
        console.log('✅ Token décodé:', decodedToken) // Debug

        if(!decodedToken || !decodedToken.userId){
            const message = "Le token ne contient pas d'identifiant utilisateur valide"
            return res.status(401).json({message})
        }

        const userId = decodedToken.userId
        req.user = { 
            userId: userId,
            email: decodedToken.email,
            role: decodedToken.role
        }

        console.log('👤 User authentifié:', req.user) // Debug

        if(req.body && req.body.userId && String(req.body.userId) !== String(userId)){
            const message = "L'identifiant de l'utilisateur est invalide"
            return res.status(403).json({message})
        }

        next()
        
    } catch(error) {
        console.error('❌ Erreur middleware auth:', error.message) // Debug
        
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                message: "Votre session a expiré, veuillez vous reconnecter"
            })
        }
        
        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({
                message: "Token invalide",
                error: error.message
            })
        }

        return res.status(401).json({
            message: "L'utilisateur n'est pas autorisé à accéder à cette ressource",
            error: error.message
        })
    }
}
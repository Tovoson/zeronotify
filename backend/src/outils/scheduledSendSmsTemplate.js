import cron from 'node-cron';
import { Op } from 'sequelize';
import Sms from '../models/sms.models.js';
import Outbox from '../models/gammu/outbox.js';
import { io } from '../app.js';

console.log('🚀 Initialisation du service de SMS planifiés...');

cron.schedule('* * * * *', async () => {
  try {
    const maintenant = new Date();
    
    const smsPlanifies = await Sms.findAll({
      where: {
        isPlaned: true,
        date_planifiee: {
          [Op.lte]: maintenant
        }
      }
    });

    if (smsPlanifies.length > 0) {
      console.log(`📤 ${smsPlanifies.length} SMS planifié(s) à envoyer`);
    }

    for (const sms of smsPlanifies) {
      try {
        // 🔍 DEBUG: Afficher les types avant parsing
        console.log('📋 Type destinataires:', typeof sms.destinataires);
        console.log('📋 Type contenu:', typeof sms.contenu);
        console.log('📋 Valeur brute destinataires:', sms.destinataires);
        console.log('📋 Valeur brute contenu:', sms.contenu);

        // ✅ Parse avec vérification robuste
        let destinataires;
        let contenu;

        // Parse destinataires
        if (typeof sms.destinataires === 'string') {
          destinataires = JSON.parse(sms.destinataires);
        } else if (Array.isArray(sms.destinataires)) {
          destinataires = sms.destinataires;
        } else {
          throw new Error('Format destinataires invalide');
        }

        // Parse contenu - CORRECTION ICI
        if (typeof sms.contenu === 'string') {
          try {
            const parsed = JSON.parse(sms.contenu);
            // Vérifier si c'est un tableau de strings
            if (Array.isArray(parsed)) {
              contenu = parsed;
            } else {
              contenu = [String(parsed)];
            }
          } catch (e) {
            // Si le parsing échoue, traiter comme une string simple
            contenu = [sms.contenu];
          }
        } else if (Array.isArray(sms.contenu)) {
          contenu = sms.contenu;
        } else {
          // Si c'est ni string ni array, convertir en array
          contenu = [String(sms.contenu)];
        }

        console.log('✅ Destinataires parsés:', destinataires);
        console.log('✅ Contenu parsé:', contenu);
        console.log('✅ Longueur destinataires:', destinataires.length);
        console.log('✅ Longueur contenu:', contenu.length);

        const totalDestinataires = destinataires.length;
        let envoyesCount = 0;
        let echecsCount = 0;

        // ✅ Boucle sur chaque destinataire
        for(let i = 0; i < totalDestinataires; i++) {
          const numero = destinataires[i];
          const message = contenu[i] || contenu[0]; // Fallback au premier message si index manquant

          console.log(`\n📨 Envoi ${i + 1}/${totalDestinataires}`);
          console.log(`   Destinataire: ${numero}`);
          console.log(`   Message: ${message}`);
          console.log(`   Type message: ${typeof message}`);

          try {
            // ✅ S'assurer que le message est bien une string
            const messageStr = String(message);

            await Outbox.create({
              DestinationNumber: numero,
              TextDecoded: messageStr,
              CreatorID: String(sms.id),
              Coding: 'Default_No_Compression',
              RelativeValidity: -1,
            });
            
            envoyesCount++;
            console.log(`✅ Envoyé avec succès à ${numero}`);

            // Émettre la progression
            io.emit('sms_progress', {
              smsId: sms.id,
              statut: 'en_cours_planifie',
              total: totalDestinataires,
              envoyes: envoyesCount,
              echecs: echecsCount,
              progression: Math.round((envoyesCount + echecsCount) / totalDestinataires * 100)
            });

          } catch (destError) {
            echecsCount++;
            console.error(`❌ Échec à ${numero}:`, destError.message);
            console.error('   Détails erreur:', destError);
            
            io.emit('sms_progress', {
              smsId: sms.id,
              statut: 'en_cours_planifie',
              total: totalDestinataires,
              envoyes: envoyesCount,
              echecs: echecsCount,
              progression: Math.round((envoyesCount + echecsCount) / totalDestinataires * 100),
              dernierEchec: { numero, erreur: destError.message }
            });
          }
        }

        // ✅ Mise à jour finale
        sms.statut = envoyesCount > 0 ? "envoye" : "echec";
        sms.dateEnvoi = new Date();
        sms.envoyes = envoyesCount;
        sms.echecs = echecsCount;
        sms.isPlaned = false;
        await sms.save();

        io.emit('sms_progress', {
          smsId: sms.id,
          statut: 'termine',
          total: totalDestinataires,
          envoyes: envoyesCount,
          echecs: echecsCount,
          progression: 100
        });

        console.log(`\n✅ SMS id ${sms.id} terminé: ${envoyesCount} envoyés, ${echecsCount} échecs\n`);
        
      } catch (error) {
        console.error(`❌ Erreur SMS ${sms.id}:`, error.message);
        console.error('Stack:', error.stack);
        
        sms.statut = "echec";
        await sms.save();
        
        io.emit('sms_progress', {
          smsId: sms.id,
          statut: 'echec_fatal',
          erreur: error.message
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur cron:', error.message);
    console.error('Stack:', error.stack);
  }
});

console.log('✅ Vérification des SMS planifiés toutes les minutes');
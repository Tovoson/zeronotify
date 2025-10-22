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
        statut: 'planifie',
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
        const destinataires = Array.isArray(sms.destinataires) 
          ? sms.destinataires 
          : JSON.parse(sms.destinataires);

        const totalDestinataires = destinataires.length;
        let envoyesCount = 0;
        let echecsCount = 0;

        io.emit('sms_progress', {
          smsId: sms.id,
          status: 'planifieEnCours',
          total: totalDestinataires,
          sent: 0,
          failed: 0,
          progress: 0
        }); 

        for(const numero of destinataires) {
          try {
            await Outbox.create({
              DestinationNumber: String(numero).trim(),
              TextDecoded: sms.contenu,
              CreatorID: String(sms.id),
              Coding: 'Default_No_Compression',
              RelativeValidity: -1,
            });
            envoyesCount++;

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
          }
        }

        sms.statut = "envoye";
        sms.dateEnvoi = new Date();
        sms.envoyes = envoyesCount;
        sms.echecs = echecsCount;
        await sms.save();

        io.emit('sms_progress', {
          smsId: sms.id,
          statut: 'termine',
          total: totalDestinataires,
          envoyes: envoyesCount,
          echecs: echecsCount,
          progression: 100
        });

        console.log(`✅ SMS id : ${sms.id} envoyé à ${envoyesCount} destinataire(s)`);
      } catch (error) {
        console.error(`❌ Erreur SMS ${sms.id}:`, error.message);
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
  }
});

console.log('✅ Vérification des SMS planifiés toutes les minutes');
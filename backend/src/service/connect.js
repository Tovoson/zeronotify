// client/test-client.js

import axios from 'axios';

// Attendre que Kannel soit prêt
async function waitForKannel(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`⏳ Vérification de Kannel (tentative ${i + 1}/${maxAttempts})...`);
      await axios.get('http://localhost:13000/status.xml', {
        auth: {
          username: 'admin',
          password: 'admin'
        },
        timeout: 2000
      });
      console.log('✅ Kannel est prêt !');
      return true;
    } catch (error) {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}

async function testSMS(expediteur, destinataire, message) {
  try {
    console.log('🚀 Démarrage du test SMS...\n');
    
    // Attendre que Kannel soit prêt
    const isReady = await waitForKannel();
    if (!isReady) {
      console.error('❌ Kannel n\'est pas accessible après 10 tentatives');
      return;
    }
    
    console.log('\n📤 Envoi du SMS...');
    
    const response = await axios.get('http://localhost:13013/cgi-bin/sendsms', {
      params: {
        username: 'testuser',
        password: 'testpass',
        from: expediteur,
        to: destinataire,
        text: message,
        dlr_mask: 31
      },
      timeout: 5000
    });
    
    console.log('✅ Réponse Kannel:', response.data);
    console.log('\n🔍 Vérifie maintenant les logs de ton serveur SMPP pour voir le SMS reçu !');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Erreur: Kannel n\'est pas démarré ou le port 13013 n\'est pas accessible');
    } else if (error.response) {
      console.error('❌ Erreur Kannel:', error.response.data);
    } else {
      console.error('❌ Erreur:', error.message);
    }
  }
}

export default testSMS;
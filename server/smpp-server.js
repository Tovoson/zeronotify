// smpp-server.js
import smpp from 'smpp';
import { v4 as uuidv4 } from 'uuid';

console.log('🚀 Démarrage du serveur SMPP...');

const server = smpp.createServer({
  debug: false  // Désactiver le debug pour voir nos logs clairement
});

const clients = new Map();

// IMPORTANT: bind_transceiver est un événement sur la SESSION, pas sur le serveur
server.on('session', function(session) {
  console.log(`\n🔗 Nouvelle session SMPP créée`);
  
  session.on('bind_transceiver', function(pdu) {
    console.log(`\n📥 BIND_TRANSCEIVER reçu:`);
    console.log(`   System ID: ${pdu.system_id}`);
    console.log(`   Password: ${pdu.password}`);
    console.log(`   Interface Version: ${pdu.interface_version}`);
    
    if (pdu.system_id && pdu.password) {
      const sessionId = uuidv4();
      clients.set(sessionId, {
        systemId: pdu.system_id,
        connectedAt: new Date(),
        session: session
      });
      
      session.sessionId = sessionId;
      session.isConnected = true;
      
      console.log(`✅ Authentification réussie - Session: ${sessionId}`);
      console.log(`   Clients connectés: ${clients.size}`);
      
      // CRITIQUE: Envoyer la réponse
      session.send(pdu.response({
        system_id: 'SMPP_SERVER'
      }));
      
      console.log(`📤 BIND_TRANSCEIVER_RESP envoyé\n`);
      
    } else {
      console.log('❌ Authentification échouée - credentials invalides');
      session.send(pdu.response({
        command_status: smpp.ESME_RBINDFAIL
      }));
      session.close();
    }
  });
  
  session.on('submit_sm', function(pdu) {
    console.log('\n📨 ========== SMS REÇU ==========');
    console.log(`   De: ${pdu.source_addr}`);
    console.log(`   Vers: ${pdu.destination_addr}`);
    console.log(`   Message: ${pdu.short_message.message || pdu.short_message.toString()}`);
    console.log(`   Client: ${clients.get(session.sessionId)?.systemId}`);
    console.log(`   Heure: ${new Date().toLocaleString()}`);
    console.log('================================\n');
    
    const messageId = 'MSG_' + Date.now();
    
    session.send(pdu.response({
      message_id: messageId
    }));
    
    console.log(`✅ SUBMIT_SM_RESP envoyé - Message ID: ${messageId}`);
    
    // Simuler un DLR après 2 secondes
    setTimeout(() => {
      if (session.isConnected) {
        console.log(`\n📬 Envoi du DLR pour message ${messageId}...`);
        
        const dlrText = `id:${messageId} sub:001 dlvrd:001 submit date:${Date.now()} done date:${Date.now()} stat:DELIVRD err:000`;
        
        const deliverSm = new smpp.PDU('deliver_sm', {
          source_addr: pdu.destination_addr,
          destination_addr: pdu.source_addr,
          short_message: Buffer.from(dlrText),
          esm_class: 4
        });
        
        session.send(deliverSm);
        console.log(`✅ DLR envoyé avec succès\n`);
      }
    }, 2000);
  });
  
  session.on('enquire_link', function(pdu) {
    const client = clients.get(session.sessionId);
    console.log(`💓 Enquire link de: ${client?.systemId || 'Unknown'}`);
    session.send(pdu.response());
  });
  
  session.on('unbind', function(pdu) {
    const client = clients.get(session.sessionId);
    console.log(`\n🔴 Déconnexion: ${client?.systemId}`);
    session.isConnected = false;
    clients.delete(session.sessionId);
    session.send(pdu.response());
    console.log(`   Clients restants: ${clients.size}\n`);
  });
  
  session.on('close', function() {
    const client = clients.get(session.sessionId);
    if (client) {
      console.log(`🔌 Session fermée: ${client.systemId}`);
      session.isConnected = false;
      clients.delete(session.sessionId);
    }
  });
  
  session.on('error', function(error) {
    console.error(`❌ Erreur session: ${error.message}`);
  });
});

server.on('error', function(error) {
  console.error('❌ Erreur serveur SMPP:', error.message);
});

const PORT = process.env.SMPP_PORT || 2775;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Serveur SMPP démarré sur 0.0.0.0:${PORT}`);
  console.log('📍 En attente de connexions...\n');
});

// Stats toutes les 60 secondes
setInterval(() => {
  if (clients.size > 0) {
    console.log(`\n📊 Statistiques:`);
    console.log(`   Clients connectés: ${clients.size}`);
    clients.forEach((client, sessionId) => {
      const uptime = Math.floor((Date.now() - client.connectedAt) / 1000);
      console.log(`   - ${client.systemId}: ${uptime}s`);
    });
    console.log('');
  }
}, 60000);
// commands/restart.js
const { exec } = require('child_process');
const { masterAdmin } = require('../config');

module.exports = {
  name: 'restart',
  cooldown: 5,
  description: 'Master-Admin only',
  async execute(sock, msg, text, from) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (sender !== masterAdmin) {
      await sock.sendMessage(from, { text: '❌ Only the *Master Admin* can restart the bot.' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: '🔁 Restarting bot...', quotedMessage: msg.message }, { quoted: msg });

    exec('pm2 restart baileys-bot', (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Failed to restart bot:', err);
        return;
      }
      console.log('✅ Bot restarted via PM2.');
    });
  }
};

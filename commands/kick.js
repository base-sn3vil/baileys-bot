// commands/kick.js
const { admins, masterAdmin } = require('../config');

module.exports = {
  name: 'kick',
  description: 'Admin Only',
  cooldown: 5,
    async execute(sock, msg, text, from) {
    const sender = msg.key.participant || msg.key.remoteJid;

    // Check if the chat is a group
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
      await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
      return;
    }

    // Check if the sender is an admin or master admin
    if (![masterAdmin, ...admins].includes(sender)) {
      await sock.sendMessage(from, { text: '❌ Only admins can use this command.' }, { quoted: msg });
      return;
    }

    // Check if there's a mentioned user
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length === 0) {
      await sock.sendMessage(from, { text: '❌ Please mention the user you want to kick.' }, { quoted: msg });
      return;
    }

    // Confirm bot is admin
    const metadata = await sock.groupMetadata(from);
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botAdmin = metadata.participants.find(p => p.id === botNumber)?.admin;
    if (!botAdmin) {
      await sock.sendMessage(from, { text: '❌ I need to be an admin to kick members.' }, { quoted: msg });
      return;
    }

    // Attempt to kick each mentioned user
    for (const jid of mentioned) {
      const isTargetAdmin = metadata.participants.find(p => p.id === jid)?.admin;
      if (isTargetAdmin) {
        await sock.sendMessage(from, { text: `⚠️ Can't kick admin: @${jid.split('@')[0]}`, mentions: [jid] }, { quoted: msg });
        continue;
      }

      try {
        await sock.groupParticipantsUpdate(from, [jid], 'remove');
        await sock.sendMessage(from, { text: `✅ Removed @${jid.split('@')[0]}`, mentions: [jid] });
      } catch (err) {
        console.error('❌ Kick error:', err);
        await sock.sendMessage(from, { text: `❌ Failed to kick @${jid.split('@')[0]}`, mentions: [jid] }, { quoted: msg });
      }
    }
  }
};

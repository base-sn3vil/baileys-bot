module.exports = {
  name: 'groupinfo',
  description: 'All Users',
  adminOnly: false,
  execute: async (sock, msg) => {
    const metadata = await sock.groupMetadata(msg.key.remoteJid);
    const info = `*Group:* ${metadata.subject}\n*Participants:* ${metadata.participants.length}`;
    await sock.sendMessage(msg.key.remoteJid, { text: info }, { quoted: msg });
  }
}

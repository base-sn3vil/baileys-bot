module.exports = {
  name: 'shutdown',
  adminOnly: true,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: '🛑 Shutting down...' }, { quoted: msg });
    process.exit();
  }
}

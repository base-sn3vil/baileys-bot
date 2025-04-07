const { admins } = require('../config');

module.exports = {
    name: 'adminonly',
    description: 'Admin-only command test',
    cooldown: 3,
    execute: async (sock, msg, text, from) => {
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!admins.includes(sender)) {
            return sock.sendMessage(from, { text: '🚫 This command is for admins only.' });
        }

        await sock.sendMessage(from, { text: '👑 Hello Admin, you have access!' });
    }
};

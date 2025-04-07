const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.js');

function getConfig() {
    delete require.cache[require.resolve(configPath)];
    return require(configPath);
}

function saveAdmins(admins) {
    const config = getConfig();
    const newConfig = {
        ...config,
        admins: admins
    };
    const updatedConfigText = `module.exports = ${JSON.stringify(newConfig, null, 4)};\n`;
    fs.writeFileSync(configPath, updatedConfigText);
}

module.exports = {
    name: 'removeadmin',
    description: 'Master-Admin Only',
    cooldown: 3,
    async execute(sock, msg, text, from) {
        const config = getConfig();
        const sender = msg.key.participant || msg.key.remoteJid;
        const isMasterAdmin = sender === config.masterAdmin;

        if (!isMasterAdmin) {
            await sock.sendMessage(from, { text: '⛔ Only the *Master Admin* can use this command.' }, { quoted: msg });
            return;
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please mention a user to remove from admin.' }, { quoted: msg });
            return;
        }

        const currentAdmins = config.admins || [];
        const filtered = currentAdmins.filter(jid => !mentioned.includes(jid));

        // Prevent removal of master admin
        if (mentioned.includes(config.masterAdmin)) {
            await sock.sendMessage(from, { text: '⚠️ You cannot remove the *Master Admin*.' }, { quoted: msg });
            return;
        }

        saveAdmins(filtered);

        await sock.sendMessage(from, {
            text: `🗑️ Removed from admin:\n${mentioned.map(jid => `• @${jid.split('@')[0]}`).join('\n')}`,
            mentions: mentioned
        }, { quoted: msg });
    }
};

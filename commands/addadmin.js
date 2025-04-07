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
        admins: Array.from(new Set(admins))
    };
    const updatedConfigText = `module.exports = ${JSON.stringify(newConfig, null, 4)};\n`;
    fs.writeFileSync(configPath, updatedConfigText);
}

module.exports = {
    name: 'addadmin',
    aliases: ['makeadmin'],
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
            await sock.sendMessage(from, { text: '❌ Please mention a user to add as admin.' }, { quoted: msg });
            return;
        }

        const currentAdmins = config.admins || [];
        const newAdmins = Array.from(new Set([...currentAdmins, ...mentioned]));

        saveAdmins(newAdmins);

        await sock.sendMessage(from, {
            text: `✅ Added as admin:\n${mentioned.map(jid => `• @${jid.split('@')[0]}`).join('\n')}`,
            mentions: mentioned
        }, { quoted: msg });
    }
};

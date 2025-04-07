const fs = require('fs');
const path = require('path');
const { masterAdmin } = require('../config');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');

function loadBalances() {
    if (!fs.existsSync(balancesPath)) return {};
    return JSON.parse(fs.readFileSync(balancesPath));
}

function saveBalances(balances) {
    fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
}

module.exports = {
    name: 'addbalance',
    aliases: ['addbal','topup'],
    description: 'Master-Admin Only',
    cooldown: 3,
    async execute(sock, msg, text, from) {
        const sender = msg.key.participant || msg.key.remoteJid;
        if (sender !== masterAdmin) {
            await sock.sendMessage(from, { text: '❌ Only the Master Admin can use this command.' }, { quoted: msg });
            return;
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const args = text.trim().split(/\s+/);
        const amount = parseInt(args[2] || args[1]);

        if (!mentioned || isNaN(amount)) {
            await sock.sendMessage(from, { text: '⚠️ Usage: *.addbalance @user 5*' }, { quoted: msg });
            return;
        }

        const balances = loadBalances();
        balances[mentioned] = (balances[mentioned] || 0) + amount;
        saveBalances(balances);

        await sock.sendMessage(from, {
            text: `✅ Added *${amount}* balance to user.\nNew balance: *${balances[mentioned]}*`,
            mentions: [mentioned]
        }, { quoted: msg });
    }
};

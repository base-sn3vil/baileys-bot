const fs = require('fs');
const path = require('path');
const balancesPath = path.join(__dirname, '../data/balances.json');
const config = require('../config');

function loadBalances() {
    if (!fs.existsSync(balancesPath)) return {};
    return JSON.parse(fs.readFileSync(balancesPath));
}

function saveBalances(balances) {
    fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
}

function formatBalance(n) {
    return n.toLocaleString();
}

module.exports = {
    name: 'balance',
    aliases: ['saldo'],
    descriptiin:'All Users',
    async execute(sock, msg, text, from) {
        const sender = msg.key.participant || msg.key.remoteJid;
        const args = text.trim().split(/\s+/);
        const command = args[0].toLowerCase();
        const balances = loadBalances();
        const isMasterAdmin = config.masterAdmin === sender;
        const isAdmin = config.admins.includes(sender) || isMasterAdmin;

        // .balance or .balance @user
        if (args.length === 1 || msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            const bal = balances[target] || 0;

            const response = (target === sender)
                ? `💰 Your balance: *${formatBalance(bal)}*`
                : `💰 Balance of @${target.split('@')[0]}: *${formatBalance(bal)}*`;

            await sock.sendMessage(from, {
                text: response,
                mentions: [target]
            }, { quoted: msg });
            return;
        }

        // Admin-only from here
        if (!isMasterAdmin) {
            await sock.sendMessage(from, { text: '⛔ Only the Master Admin can use this command.' }, { quoted: msg });
            return;
        }

        // .addbalance <number> @user
        if (command === '.addbalance' && args.length >= 2) {
            const amount = parseInt(args[1]);
            const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!target || isNaN(amount)) {
                await sock.sendMessage(from, { text: '❌ Usage: .addbalance <amount> @user' }, { quoted: msg });
                return;
            }

            balances[target] = (balances[target] || 0) + amount;
            saveBalances(balances);

            await sock.sendMessage(from, {
                text: `✅ Added *${amount}* balance to @${target.split('@')[0]}.\nNew balance: *${formatBalance(balances[target])}*`,
                mentions: [target]
            }, { quoted: msg });
            return;
        }

        // .setbalance <number> @user
        if (command === '.setbalance' && args.length >= 2) {
            const amount = parseInt(args[1]);
            const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!target || isNaN(amount)) {
                await sock.sendMessage(from, { text: '❌ Usage: .setbalance <amount> @user' }, { quoted: msg });
                return;
            }

            balances[target] = amount;
            saveBalances(balances);

            await sock.sendMessage(from, {
                text: `✅ Set balance of @${target.split('@')[0]} to *${formatBalance(amount)}*`,
                mentions: [target]
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { text: '❌ Invalid balance command or usage.' }, { quoted: msg });
    }
};

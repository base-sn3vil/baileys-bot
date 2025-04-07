const { masterAdmin, admins } = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'listusers',
    aliases: ['lu', 'groupusers','list'],
    description: 'Master-Admin only',
    async execute(sock, msg, text, from) {
        const sender = msg.key.participant || msg.key.remoteJid;

        // Master admin only
        if (sender !== masterAdmin) {
            await sock.sendMessage(from, { text: '❌ Only the Master Admin can use this command.' }, { quoted: msg });
            return;
        }

        // Group only
        if (!from.endsWith('@g.us')) {
            await sock.sendMessage(from, { text: '❌ This command can only be used in a group.' }, { quoted: msg });
            return;
        }

        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(from);
        } catch (err) {
            console.error('❌ Error fetching group metadata:', err);
            await sock.sendMessage(from, { text: '⚠️ Failed to fetch group information.' }, { quoted: msg });
            return;
        }

        const participants = groupMetadata.participants || [];
        const mentions = [];
        const masterAdmins = [];
        const adminList = [];
        const userList = [];

        // Load balances
        const balancesPath = path.join(__dirname, '../data/balances.json');
        let balances = {};
        try {
            balances = JSON.parse(fs.readFileSync(balancesPath, 'utf-8'));
        } catch (err) {
            console.error('⚠️ Failed to read balances.json:', err);
        }

        for (const p of participants) {
            const jid = p.id;
            const isMaster = jid === masterAdmin;
            const isAdmin = admins.includes(jid);

            mentions.push(jid);

            if (isMaster) {
                masterAdmins.push(jid);
            } else if (isAdmin) {
                const balance = balances[jid] || 0;
                adminList.push({ jid, balance });
            } else {
                userList.push(jid);
            }
        }

        const formatList = (list) =>
            list.length
                ? list.map(j => `• @${j.split('@')[0]}`).join('\n')
                : 'None';

        const formatAdminList = (list) =>
            list.length
                ? list.map(({ jid, balance }) => `• @${jid.split('@')[0]} (Balance: ${balance})`).join('\n')
                : 'None';

        const groupName = groupMetadata.subject;

        const message = `👥 *Group: ${groupName}*\n\n` +
                        `👑 *Master Admin:*\n${formatList(masterAdmins)}\n\n` +
                        `🛡️ *Regular Admins:*\n${formatAdminList(adminList)}\n\n` +
                        `👤 *Users:*\n${formatList(userList)}`;

        await sock.sendMessage(from, {
            text: message,
            mentions
        }, { quoted: msg });
    }
};

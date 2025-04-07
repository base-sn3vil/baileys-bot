const axios = require('axios');

module.exports = {
    name: 'check-key',
    aliases: ['ck', 'keycheck'],
    description: 'All Users',
    cooldown: 10,
    execute: async (sock, msg, text, from) => {
        const sender = msg.key.participant || msg.key.remoteJid;

        const cleanText = text.replace(/^[!@.#$:_-]*\w+/, '').trim();

        if (!cleanText) {
            return sock.sendMessage(from, {
                text: '⚠️ Please provide one or more product keys to check.\nExample:\n!ck XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'
            });
        }

        const rawKeys = cleanText
            .split(/\s+/)
            .map(k => k.trim().replace(/[^A-Z0-9-]/gi, ''))
            .filter(k => k.length >= 25);

        if (!rawKeys.length) {
            return sock.sendMessage(from, {
                text: '⚠️ No valid product keys detected.'
            });
        }

        const keysParam = encodeURIComponent(rawKeys.join('\n'));
        const url = `https://pidkey.com/ajax/pidms_api?keys=${keysParam}&justgetdescription=0&apikey=t4CxiApPE1rjncOfuQHcD6F74`;

        try {
            const res = await axios.get(url);
            const results = res.data;

            if (!Array.isArray(results)) {
                throw new Error('Unexpected API response format.');
            }

            const errorDescriptions = {
                '0xC004C008': 'Get confirmation ID',
                '0xC004C020': 'Get confirmation ID',
                '0xC004C060': 'Dead key',
                '0xC004C003': 'Key blocked',
                '0xC004C004': 'Fake key'
            };

            let reply = '';

            for (const item of results) {
                const key = item.keyname_with_dash || 'Unknown Key';
                const product = item.prd || 'N/A';
                const type = item.is_retail === 1 ? 'Retail' : (item.is_retail === 0 ? 'MAK' : 'Unknown');
                const sub = item.sub || 'N/A';
                const error = item.errorcode || 'N/A';
                const errorExplain = errorDescriptions[error] || 'No description';
                const checked = item.datetime_checked_done || 'Unknown';

                const blocked =
                    item.blocked === 1 ? 'Blocked' :
                    item.blocked === 0 || item.blocked === -1 ? 'Valid' :
                    'Unknown';

                reply += `🔑 *${key}*\n`;
                reply += `• Product: ${product}\n`;
                reply += `• Type: ${type}\n`;
                reply += `• Status: ${blocked}\n`;
                reply += `• Sub: ${sub}\n`;
                reply += `• Error: ${error} (${errorExplain})\n`;
                reply += `• Checked: ${checked}\n\n`;
            }

            await sock.sendMessage(from, { text: reply.trim() });

        } catch (err) {
            console.error('❌ Error checking keys:', err.message || err);
            await sock.sendMessage(from, {
                text: '⚠️ Failed to check keys. Please try again later.'
            });
        }
    }
};

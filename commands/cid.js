const axios = require('axios');

module.exports = {
    name: 'cid',
    aliases: ['iid'],
    description: 'All Users',
    cooldown: 3,
    async execute(sock, msg, text, from) {
        const cleanedText = text.split(/\s+/).slice(1).join('').replace(/[^0-9]/g, '');
        if (!cleanedText) {
            await sock.sendMessage(from, { text: '❌ Please provide a valid Installation ID.' });
            return;
        }

        const apiKey = 't4CxiApPE1rjncOfuQHcD6F74';
        const url = `https://pidkey.com/ajax/cidms_api?iids=${cleanedText}&justforcheck=1&apikey=${apiKey}`;

        try {
            const { data } = await axios.get(url);

            // 🔍 Log raw response for debugging
            console.log('📦 CID API raw response:', data);

            if (data?.have_cid && data.confirmation_id_with_dash) {
                await sock.sendMessage(from, {
                    text: `✅ *CID Found!*\n\nCID:\n${data.confirmation_id_with_dash}\nChecked: ${data.result || 'Unknown'}`
                });
            } else {
                let note = '';
                if (data?.result?.includes('professional')) {
                    note = '\n💡 Note: CID retrieval may require a professional account.';
                }
                await sock.sendMessage(from, {
                    text: `🔍 *CID Not Found*\nStatus: ${data.result || 'Unknown'}\nChecked: ${data.typeiid === 1 ? 'Retail' : 'Unknown'}${note}`
                });
            }
        } catch (err) {
            console.error('❌ Error in cid:', err);
            await sock.sendMessage(from, {
                text: '⚠️ Error occurred while checking CID. Please try again later.'
            });
        }
    }
};


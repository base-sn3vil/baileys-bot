// commands/getcid.js
const axios = require('axios');
const { admins } = require('../config');

module.exports = {
  name: 'getcid',
  aliases: ['gcid','gc'], 
  description: 'Get Confirmation ID',
  cooldown: 60, // 1 minute cooldown per user
  async execute(sock, msg, text, from) {
    const sender = msg.key.participant || msg.key.remoteJid;

    // Admin-only check
    if (!admins.includes(sender)) {
      await sock.sendMessage(from, { text: '❌ You are not authorized to use this command.' }, { quoted: msg });
      return;
    }

    // Extract and sanitize IID input
    const rawInput = text.split(/\s+/).slice(1).join('');
    const digitsOnly = rawInput.replace(/\D/g, '');

    // Split into 9 blocks of 7-digit numbers
    const blocks = digitsOnly.match(/\d{7}/g);
    if (!blocks || blocks.length !== 9) {
      await sock.sendMessage(from, {
        text: '❌ Invalid Installation ID. It must contain 9 blocks of exactly 7-digit numbers.'
      }, { quoted: msg });
      return;
    }

    const iid = blocks.join('');
    const apiKey = 't4CxiApPE1rjncOfuQHcD6F74';
    const url = `https://pidkey.com/ajax/cidms_api?iids=${iid}&justforcheck=0&apikey=${apiKey}`;

    try {
      const { data } = await axios.get(url);
      console.log('📦 GETCID API raw response:', data);

      if (data?.have_cid && data.confirmation_id_with_dash) {
        await sock.sendMessage(from, {
          text: `✅ *Get Confirmation ID Success!*\n\nCID:\n${data.confirmation_id_with_dash}\nStatus: ${data.result || 'Unknown'}`
        }, { quoted: msg });
      } else {
        let note = '';
        if (data?.result?.includes('professional')) {
          note = '\n💡 Note: CID retrieval may require a professional account.';
        }
        await sock.sendMessage(from, {
          text: `🔍 *CID Not Found*\nStatus: ${data.result || 'Unknown'}\nType: ${data.typeiid === 1 ? 'Retail' : 'Unknown'}${note}`
        }, { quoted: msg });
      }
    } catch (err) {
      console.error('❌ Error in getcid:', err);
      await sock.sendMessage(from, {
        text: '⚠️ Error occurred while retrieving CID. Please try again later.'
      }, { quoted: msg });
    }
  }
};

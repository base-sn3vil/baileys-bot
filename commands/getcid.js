const axios = require('axios');
const fs = require('fs');
const { admins, masterAdmin } = require('../config');
const balancePath = './data/balances.json';
const apiKey = 't4CxiApPE1rjncOfuQHcD6F74';

if (!fs.existsSync(balancePath)) fs.writeFileSync(balancePath, '{}');
const queue = [];
let processing = false;

module.exports = {
    name: 'getcid',
    aliases: ['gc', 'gcid'],
    description: 'Get Confirmation ID',
    cooldown: 6,
    async execute(sock, msg, text, from) {
        const sender = msg.key.participant || msg.key.remoteJid;
        const body = text.split(/\s+/).slice(1).join(' ');
        const cleaned = body.replace(/[^0-9]/g, '');

        // Check Master Admin
        const isMaster = sender === masterAdmin;
        const isAdmin = isMaster || admins.includes(sender);

        if (!isAdmin) {
            await sock.sendMessage(from, {
                text: '❌ You are not allowed to use this command.\nPlease contact the Master Admin for access.'
            }, { quoted: msg });
            return;
        }

        // Validate Installation ID
        const match = cleaned.match(/(\d{7}){9}/);
        if (!match) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a valid Installation ID with 9 blocks of 7-digit numbers.'
            }, { quoted: msg });
            return;
        }

        const iid = match[0];

        // Check balance for regular admin
        if (!isMaster) {
            const balances = JSON.parse(fs.readFileSync(balancePath));
            const userBalance = balances[sender] || 0;

            if (userBalance < 1) {
                await sock.sendMessage(from, {
                    text: '⚠️ Your balance is 0.\nPlease contact the Master Admin to top up.'
                }, { quoted: msg });
                return;
            }
        }

        // Add to queue
        queue.push({ sock, msg, from, sender, iid, isMaster });
        const position = queue.length;

        if (position > 1) {
            await sock.sendMessage(from, {
                text: `🕐 You're in queue position #${position}. Please wait...`
            }, { quoted: msg });
        }

        if (!processing) processQueue();
    }
};

async function processQueue() {
    if (queue.length === 0) {
        processing = false;
        return;
    }

    processing = true;
    const { sock, msg, from, sender, iid, isMaster } = queue.shift();

    await sock.sendMessage(from, {
        text: `🔄 Processing your Installation ID request now...`
    }, { quoted: msg });

    const url = `https://pidkey.com/ajax/cidms_api?iids=${iid}&justforcheck=0&apikey=${apiKey}`;

    try {
        const { data } = await axios.get(url);

        if (data?.have_cid && data.confirmation_id_with_dash) {
            await sock.sendMessage(from, {
                text: `✅ *CID Success!*\n\nCID:\n${data.confirmation_id_with_dash}\nChecked: ${data.result || 'Unknown'}`
            }, { quoted: msg });

            // Deduct balance if not master
            if (!isMaster) {
                const balances = JSON.parse(fs.readFileSync(balancePath));
                balances[sender] = (balances[sender] || 0) - 1;
                fs.writeFileSync(balancePath, JSON.stringify(balances, null, 2));
            }
        } else {
            let note = '';
            if (data?.result?.includes('professional')) {
                note = '\n💡 Note: CID retrieval may require a professional account.';
            }
            await sock.sendMessage(from, {
                text: `🔍 *CID Not Found*\nStatus: ${data.result || 'Unknown'}\nChecked: ${data.typeiid === 1 ? 'Retail' : 'Unknown'}${note}`
            }, { quoted: msg });
        }
    } catch (err) {
        console.error('❌ Error in getcid:', err);
        await sock.sendMessage(from, {
            text: '⚠️ Error occurred while retrieving CID. Please try again later.'
        }, { quoted: msg });
    }

    setTimeout(processQueue, 500);
}

module.exports = {
    name: 'ping',
    aliases: ['p', 'latency'],
    description: 'All Users',
    cooldown: 5,
    execute: async (sock, msg, text, from) => {
        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: 'Pinging...' });

        const latency = Date.now() - start;
        await sock.sendMessage(from, { text: `🏓 Pong! Latency: *${latency}ms*` });

        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: true,
                id: sent.key.id,
                participant: sock.user.id
            }
        });
    }
};


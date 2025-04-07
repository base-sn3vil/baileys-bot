module.exports = {
    name: 'help',
    description: 'Lists all available commands',
    cooldown: 2,
    execute: async (sock, msg, text, from, commands) => {
        const helpText = '📋 *Available Commands:*\n' +
            commands.map(cmd => `• ${cmd.name} - ${cmd.description}`).join('\n');
        await sock.sendMessage(from, { text: helpText });
    }
};

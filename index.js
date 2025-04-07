global.crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const P = require('pino');
const NodeCache = require('node-cache');
const { Boom } = require('@hapi/boom');
const { admins, commandPrefixes } = require('./config');

const logger = P({ level: 'info' });
const msgRetryCounterCache = new NodeCache();
const cooldowns = new Map();
const commands = [];

// Load command files
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command);
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, latest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        msgRetryCounterCache
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom
                    ? lastDisconnect.error.output.statusCode
                    : 0) !== DisconnectReason.loggedOut;

            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot is ready');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || '';

        console.log(`💬 ${from}: ${text}`);

        for (const command of commands) {
            const allNames = [command.name, ...(command.aliases || [])];
            const matchedName = allNames.find(name =>
                commandPrefixes.some(p => text.toLowerCase().startsWith(p + name))
            );

            if (!matchedName) continue;

            // Cooldown check
            const now = Date.now();
            const cooldownTime = (command.cooldown || 3) * 1000;

            if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Map());
            const timestamps = cooldowns.get(command.name);

            if (timestamps.has(sender)) {
                const expiration = timestamps.get(sender) + cooldownTime;
                if (now < expiration) {
                    const remaining = Math.ceil((expiration - now) / 1000);
                    await sock.sendMessage(from, {
                        text: `⏳ Please wait *${remaining}s* before using *${matchedName}* again.`
                    });
                    return;
                }
            }

            timestamps.set(sender, now);
            setTimeout(() => timestamps.delete(sender), cooldownTime);

            try {
                await command.execute(sock, msg, text, from, commands);
            } catch (err) {
                console.error(`❌ Error in ${command.name}:`, err);
                await sock.sendMessage(from, { text: '⚠️ An error occurred while executing the command.' });
            }

            break; // stop after the first match
        }
    });
}

startBot();


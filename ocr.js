// ocr.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Tesseract = require('tesseract.js');
const Jimp = require('jimp');

module.exports = {
  name: 'ocr',
  cooldown: 10,
  description: 'Extract Installation ID from an image',
  async execute(sock, m) {
    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasCaption = m.message?.imageMessage?.caption?.toLowerCase().includes('.ocr');

      const isImage = quoted?.imageMessage || (m.message?.imageMessage && hasCaption);
      if (!isImage) {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Reply to an image with ".ocr" or send an image with ".ocr" caption.' }, { quoted: m });
        return;
      }

      const msg = quoted?.imageMessage ? { message: { imageMessage: quoted.imageMessage }, key: m.message.extendedTextMessage.contextInfo.stanzaId } : m;
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });

      const image = await Jimp.read(buffer);
      image.greyscale().contrast(0.5).normalize();

      const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
      const result = await Tesseract.recognize(processedBuffer, 'eng');

      const text = result.data.text;
      console.log('[OCR raw text]', text);

      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

      // Filter only lines with many long numbers (7+ digits)
      const candidateLines = lines.filter(line => {
        const numbers = line.match(/\b\d{6,}\b/g);
        return numbers && numbers.length >= 7;
      });

      let iid = null;
      for (const line of candidateLines) {
        const matches = line.match(/\b\d{6,}\b/g);
        if (matches && matches.length === 9) {
          iid = matches.join('-');
          break;
        }
      }

      if (iid) {
        await sock.sendMessage(m.key.remoteJid, {
          text: `✅ Installation ID:\n${iid}`,
          contextInfo: { mentionedJid: [m.key.participant || m.key.remoteJid], quotedMessage: m.message }
        }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to extract Installation ID.' }, { quoted: m });
      }
    } catch (err) {
      console.error('❌ Error in ocr:', err);
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Error processing OCR.' }, { quoted: m });
    }
  }
};


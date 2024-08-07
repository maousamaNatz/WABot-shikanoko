const fs = require('fs');
const path = require('path');
const { createStickerFromImage } = require('../helpers/stickerHelpers');
const { stickerStoragePath } = require('../config/Mpath');
const { decryptMedia } = require('@open-wa/wa-decrypt');
// const { MessageType } = require('@wppconnect-team/wppconnect');

/**
 * Menangani perintah pembuatan stiker
 * @param {Object} client - Objek klien WhatsApp
 * @param {Object} message - Objek pesan
 * @returns {Promise<void>}
 */
const handleStickerCommand = async (client, message) => {
  try {
    console.log('Client object in handleStickerCommand:', client);

    // Periksa metode yang tersedia pada objek client
    const availableMethods = Object.keys(client);
    console.log('Available methods on client:', availableMethods);

    if (message.type === 'image') {
      const mediaData = message;
      console.log('Decrypting media...');

      const mediaBuffer = await decryptMedia(mediaData);
      if (!mediaBuffer) {
        throw new Error('Failed to decrypt media');
      }
      console.log('Media decrypted successfully');

      const imagePath = path.join(stickerStoragePath, `image-${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, mediaBuffer);
      console.log('Media saved to:', imagePath);

      const stickerBuffer = await createStickerFromImage(imagePath);

      if (stickerBuffer) {
        const stickerPath = path.join(stickerStoragePath, `sticker-${Date.now()}.webp`);
        fs.writeFileSync(stickerPath, stickerBuffer);
        console.log('Sticker created successfully at:', stickerPath);

        // Pastikan format file dikirim sebagai stiker
        const stickerBase64 = fs.readFileSync(stickerPath, { encoding: 'base64' });

        if (typeof client.sendImageAsSticker === 'function') {
          await client.sendImageAsSticker(message.from, `data:image/webp;base64,${stickerBase64}`);
        } else {
          console.log('sendImageAsSticker method is not available on client object');
          if (typeof client.sendText === 'function') {
            await client.sendText(message.from, 'Unable to send sticker, sendImageAsSticker method not found.');
          }
        }

        fs.unlinkSync(imagePath);
        fs.unlinkSync(stickerPath);
        console.log('Sticker sent and files cleaned up');
      } else {
        if (typeof client.sendText === 'function') {
          await client.sendText(message.from, 'Failed to create sticker.');
        } else {
          console.log('sendText method is not available on client object');
        }
        console.log('Failed to create sticker');
      }
    } else {
      if (typeof client.sendText === 'function') {
        await client.sendText(message.from, 'No media found to create sticker.');
      } else {
        console.log('sendText method is not available on client object');
      }
      console.log('No media found');
    }
  } catch (error) {
    console.error('Error handling sticker command:', error);
    if (typeof client.sendText === 'function') {
      await client.sendText(message.from, 'Error processing sticker command.');
    } else {
      console.log('sendText method is not available on client object');
    }
  }
};

module.exports = {
  handleStickerCommand,
};
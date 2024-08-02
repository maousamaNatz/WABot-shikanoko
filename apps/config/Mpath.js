const path = require('path');
const fs = require('fs');

const stickerStoragePath = path.join(__dirname, '../downloads/stickers');
const mediaStoragePath = path.join(__dirname, '../downloads/media');

if (!fs.existsSync(stickerStoragePath)) {
  fs.mkdirSync(stickerStoragePath, { recursive: true });
}

module.exports = {
  mediaStoragePath,
  stickerStoragePath,
};

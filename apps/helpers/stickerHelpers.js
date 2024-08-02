const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const path = require('path');

const createStickerFromImage = async (imagePath) => {
  try {
    console.log('Creating sticker from image:', imagePath);
    const sticker = new Sticker(imagePath, {
      pack: 'My Sticker Pack',
      author: 'My Name',
      type: StickerTypes.FULL,
      quality: 100
    });

    const stickerBuffer = await sticker.toBuffer();
    if (stickerBuffer) {
      const stickerPath = imagePath.replace('.jpg', '.webp');
      fs.writeFileSync(stickerPath, stickerBuffer);
      return stickerBuffer;
    }
  } catch (error) {
    console.error('Error creating sticker:', error);
    throw error;
  }
};

module.exports = {
  createStickerFromImage,
};

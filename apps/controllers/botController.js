const { Bot } = require("../models");
const fs = require("fs");
const path = require("path");

const editBotProfilePicture = async (client, imagePath) => {
  try {
    console.log(Object.keys(client)); // Tambahkan ini untuk melihat semua metode dalam objek client
    
    // Mengubah gambar profil bot
    await client.setProfilePic(path.resolve(imagePath));

    // Menghapus gambar dari direktori setelah diupload
    fs.unlinkSync(path.resolve(imagePath));

    return "Gambar profil bot berhasil diubah.";
  } catch (error) {
    console.error("Error saat mengganti gambar profil bot:", error);
    return "Terjadi kesalahan saat mengganti gambar profil bot.";
  }
};


const editBotProfile = async (name, description) => {
  await Bot.update({ name, description }, { where: { id: 1 } });
  return "Profil bot berhasil diperbarui.";
};

const changeBotName = async (newName) => {
  await Bot.update({ name: newName }, { where: { id: 1 } });
  return `Nama bot berhasil diubah menjadi ${newName}.`;
};

const deactivateBot = async () => {
  await Bot.update({ isActive: false }, { where: { id: 1 } });
  return "Bot telah dinonaktifkan.";
};

const activateBot = async () => {
  await Bot.update({ isActive: true }, { where: { id: 1 } });
  return "Bot telah diaktifkan.";
};

module.exports = {
  editBotProfile,
  changeBotName,
  deactivateBot,
  activateBot,
  editBotProfilePicture, // pastikan untuk mengekspor fungsi baru
};
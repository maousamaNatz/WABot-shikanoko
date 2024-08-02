const { User } = require("../models");

const getBotInfo = async () => {
  try {
    const devUsers = await User.findAll({ where: { type: 'dev' } });
    const adminUsers = await User.findAll({ where: { type: 'admin' } });
    const adminBotUsers = await User.findAll({ where: { type: 'admin-bot' } });
    const subscriberUsers = await User.findAll({ where: { type: 'subscriber' } });

    const devNames = devUsers.map(user => `@${user.username}`).join('\n');
    const adminNames = adminUsers.map(user => `@${user.username}`).join('\n');
    const adminBotNames = adminBotUsers.map(user => `@${user.username}`).join('\n');
    const subscriberNames = subscriberUsers.map(user => `@${user.username}`).join('\n');

    return `~ Developer:\n${devNames || 'Tidak ada developer terdaftar'}\n\n` +
           `~ Admin:\n${adminNames || 'Tidak ada admin terdaftar'}\n\n` +
           `~ Admin-bot:\n${adminBotNames || 'Tidak ada admin-bot terdaftar'}\n\n`  +
           `~ User langganan:\n${subscriberNames || 'Tidak ada user langganan terdaftar'}`;
  } catch (error) {
    console.error("Error fetching bot info:", error);
    return "Terjadi kesalahan saat mengambil informasi bot.";
  }
};

const getHelloMessage = (name) => {
  console.log(`Generating HELLO message for: ${name}`);
  const message = `HELLO ${name} saya adalah chatbot.\n\n` +
  `Nama saya adalah Shikanoko.\n` +
  `\n` +
  `Berikut fitur yang di tambahkan.\n` +
  `\n` +
  `*#Download:*\n` +
  `./downloads *(url/link)*\n` +
  `\n` +
  `*#GAME:*\n` +
  `Tiktaktoe.\n` +
  `Catur.\n` +
  `Tebak-Gambar.\n` +
  `Tebak-kata.\n` +
  `tanya-jawab.\n` +
  `\n` +
  `*#Groups:*\n` +
  `./kick-member.\n` +
  `./hidetag.\n` +
  `@everyone.\n` +
  `!get-news.\n` +
  `\n` +
  `*#info*.\n` +
  `./help *(fitur)*\n` +
  `./owner\n` +
  `./profil\n` +
  `./more-info\n` +
  `\n` +
  `*#More Fitur:\n*` +
  `./wiki search` +
  `\n` +
  `Jika terdapat bug atau bot ga jelas hubungi Natz selaku dev dari bot.`;
  console.log(`Generated message: ${message}`);
  return message;
};

const getFeatureHelp = (feature) => {
  const features = {
    "sticker": "Perintah ./sticker digunakan untuk membuat stiker dari gambar yang dikirim.",
    "everyone": "Perintah @everyone digunakan untuk menandai semua anggota grup.",
    "user": "Perintah !user digunakan untuk mencari daftar user level di dalam database.",
    "download": "Perintah ./download digunakan untuk mengunduh media dari link yang diberikan.",
    "more-info": "Perintah ./more-info memberikan informasi tambahan tentang bot.",
  };

  return features[feature.toLowerCase()] || "Fitur tidak ditemukan. Gunakan help diikuti dengan nama fitur untuk mendapatkan info lebih lanjut.";
};

const handleMoreInfoCommand = async () => {
  console.log("Handling more info command");
  return await getBotInfo();
};

module.exports = {
  getHelloMessage,
  handleMoreInfoCommand,
  getFeatureHelp
};

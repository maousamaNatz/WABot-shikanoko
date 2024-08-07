const { User } = require("../models");
const fs = require("fs").promises;
const path = require("path");
const logMessages = require("../config/log.json");

const getBotInfo = async () => {
  try {
    const devUsers = await User.findAll({ where: { type: "dev" } });
    const adminUsers = await User.findAll({ where: { type: "admin" } });
    const adminBotUsers = await User.findAll({ where: { type: "admin-bot" } });
    const subscriberUsers = await User.findAll({ where: { type: "subscriber" } });

    const devNames = devUsers.map((user) => `@${user.username}`).join("\n");
    const adminNames = adminUsers.map((user) => `@${user.username}`).join("\n");
    const adminBotNames = adminBotUsers.map((user) => `@${user.username}`).join("\n");
    const subscriberNames = subscriberUsers.map((user) => `@${user.username}`).join("\n");

    return (
      `~ Developer:\n${devNames || "Tidak ada developer terdaftar"}\n\n` +
      `~ Admin:\n${adminNames || "Tidak ada admin terdaftar"}\n\n` +
      `~ Admin-bot:\n${adminBotNames || "Tidak ada admin-bot terdaftar"}\n\n` +
      `~ User langganan:\n${subscriberNames || "Tidak ada user langganan terdaftar"}`
    );
  } catch (error) {
    console.error("Error fetching bot info:", error);
    return logMessages.errors.featureNotFound;
  }
};

const getHelloMessage = (name) => {
  console.log(`Generating HELLO message for: ${name}`);
  const message =
    `HELLO ${name} saya adalah chatbot.\n\n` +
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

const getFeatureHelp = async (feature) => {
  try {
    const infoPath = path.join(__dirname, "data", "info.json");
    const infoData = await fs.readFile(infoPath, "utf8");
    const info = JSON.parse(infoData);

    return info.features[feature.toLowerCase()] || logMessages.errors.featureNotFound;
  } catch (error) {
    console.error("Error reading feature info:", error);
    return logMessages.errors.featureNotFound;
  }
};

const handleMoreInfoCommand = async () => {
  console.log("Handling more info command");
  try {
    const infoPath = path.join(__dirname, "data", "info.json");
    const infoData = await fs.readFile(infoPath, "utf8");
    const info = JSON.parse(infoData);

    const moreInfo = `
Informasi Tambahan:

Versi Bot: ${info.bot.version}
Bahasa Pemrograman: ${info.bot.language}
Framework: ${info.bot.framework}
Fitur Utama:
${info.bot.mainFeatures.map(feature => `- ${feature}`).join('\n')}

Untuk informasi lebih lanjut, silakan hubungi developer atau admin.
    `;

    return moreInfo.trim();
  } catch (error) {
    console.error("Error membaca informasi tambahan:", error);
    return logMessages.errors.featureNotFound;
  }
};

const handleOwnerCommand = async () => {
  console.log("Handling owner command");
  try {
    const infoPath = path.join(__dirname, "data", "info.json");
    const infoData = await fs.readFile(infoPath, "utf8");
    const info = JSON.parse(infoData);

    return `Profil Owner:\n\nNama: ${info.owner.name}\nKontak: ${info.owner.contact}\nPeran: ${info.owner.role}\nTentang: ${info.owner.about}`;
  } catch (error) {
    console.error("Error reading owner profile:", error);
    return logMessages.errors.featureNotFound;
  }
};
module.exports = {
  getHelloMessage,
  handleMoreInfoCommand,
  getFeatureHelp,
  handleOwnerCommand,
};
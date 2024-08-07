const { User } = require("../models");
const fs = require("fs");
const {
  handleUserCommand,
  handleEveryoneCommand,
  handleDownloadCommand,
} = require("./userController");
const { handleStickerCommand } = require("./stickerController");
const {
  getHelloMessage,
  handleMoreInfoCommand,
  getFeatureHelp,
  handleOwnerCommand,
  handleProfileCommand,
} = require("./infoController");
const { handleMalCommand } = require("./MalController");
const path = require("path");
const processedMessages = new Set();
const logMessages = require("../config/log.json");

const {
  startTebakKata,
  startTicTacToe,
  startMathGame,
  startTebakLirik,
  startTekaTeki,
  startAsahOtak,
  startFamily100,
  startSiapakahAku,
  checkAnswer,
} = require("./gameController");
const {
  pinterest,
  wallpaper,
  wikimedia,
  quotesAnime,
  ringtone,
  styletext,
  searchWikipedia,
} = require("./scrapper");

const {
  editBotProfile,
  changeBotName,
  deactivateBot,
  activateBot,
  getBotStatus,
  editBotProfilePicture, // impor fungsi baru
} = require("./botController");

/**
 * Menangani pesan masuk dari pengguna
 * @param {Object} message - Objek pesan yang diterima
 * @param {string} message.id - ID unik pesan
 * @param {string} message.from - Nomor pengirim pesan
 * @param {string} message.chatId - ID chat (grup atau individu)
 * @param {string} message.author - ID penulis pesan (untuk pesan grup)
 * @param {Object} message.sender - Informasi tentang pengirim
 * @param {string} message.sender.pushname - Nama tampilan pengirim
 * @param {string} message.sender.verifiedName - Nama terverifikasi pengirim
 * @param {string} message.body - Isi pesan
 * @param {string} [message.caption] - Keterangan untuk pesan media
 * @param {Object} client - Objek klien WhatsApp
 * @param {Function} client.sendText - Fungsi untuk mengirim pesan teks
 * @param {Function} client.reply - Fungsi untuk membalas pesan dalam grup
 */
const handleIncomingMessage = async (message, client) => {
  const messageId = message.id;
  if (processedMessages.has(messageId)) {
    console.log(`Message ID ${messageId} already processed.`);
    return;
  }

  processedMessages.add(messageId);

  let user = null; // Inisialisasi user di sini
  const number = message.from;
  const groupId = message.chatId || message.from;
  const senderId = message.author || message.from;
  const senderName =
    (message.sender &&
      (message.sender.pushname || message.sender.verifiedName)) ||
    "Pengguna";
  const isGroupMessage = groupId.endsWith("@g.us");
  let response = "";

  console.log(`Message ID: ${messageId}`);
  console.log(`Number: ${number}`);
  console.log(`Sender Name: ${senderName}`);

  const lowerCaseBody = message.body ? message.body.toLowerCase() : "";

  if (!isGroupMessage) {
    user = await User.findOne({ where: { number } });
    console.log(`User found: ${JSON.stringify(user)}`);
  }

  const userRole = user ? user.role : "user"; // Gunakan user di sini setelah diinisialisasi
  const userName = user ? user.username : senderName;

  /**
   * Menangani pesan dalam grup
   * @groupCommands
   * @command @everyone - Menandai semua anggota grup
   * @command help [fitur] - Menampilkan bantuan untuk fitur tertentu
   * @command ./more-info - Menampilkan informasi tambahan
   * @command !info - Menampilkan pesan sambutan
   * @command ./tebak-kata - Memulai permainan Tebak Kata
   * @command ./tictactoe - Memulai permainan Tic Tac Toe
   * @command ./math-game - Memulai permainan Matematika
   * @command ./tebak-lirik - Memulai permainan Tebak Lirik
   * @command ./teka-teki - Memulai permainan Teka-teki
   * @command ./asah-otak - Memulai permainan Asah Otak
   * @command ./family100 - Memulai permainan Family 100
   * @command ./siapakah-aku - Memulai permainan Siapakah Aku
   * @command .jawab [jawaban] - Menjawab pertanyaan dalam permainan
   */
  if (isGroupMessage) {
    if (lowerCaseBody === "@everyone") {
      if (isUserAuthorized(userRole, "admin")) {
        response = await handleEveryoneCommand(client, groupId, senderId);
      } else {
        response = logMessages.errors.onlyAdminCanUse;
      }
    } else if (lowerCaseBody.startsWith("help ")) {
      const feature = lowerCaseBody.split(" ")[1];
      response = getFeatureHelp(feature);
    } else if (lowerCaseBody === "./tebak-kata") {
      response = await startTebakKata(groupId);
    } else if (lowerCaseBody === "./tictactoe") {
      response = await startTicTacToe(groupId);
    } else if (lowerCaseBody === "./math-game") {
      response = await startMathGame(groupId);
    } else if (lowerCaseBody === "./tebak-lirik") {
      response = await startTebakLirik(groupId);
    } else if (lowerCaseBody === "./teka-teki") {
      response = await startTekaTeki(groupId);
    } else if (lowerCaseBody === "./asah-otak") {
      response = await startAsahOtak(groupId);
    } else if (lowerCaseBody === "./family100") {
      response = await startFamily100(groupId);
    } else if (lowerCaseBody === "./siapakah-aku") {
      response = await startSiapakahAku(groupId);
    } else if (lowerCaseBody.startsWith(".jawab ")) {
      response = await checkAnswer(groupId, lowerCaseBody);
    } else {
      // Cek jawaban untuk permainan yang sedang berlangsung
      const gameResponse = await checkAnswer(groupId || number, lowerCaseBody);
      if (gameResponse) {
        response = gameResponse;
      }
    }
  }

  /**
   * Menangani pesan pribadi
   * @privateCommands
   * @devCommands Menangani perintah khusus developer
   * @command !user - Menampilkan informasi pengguna
   * @command !info - Menampilkan pesan sambutan
   * @command ./owner - Menampilkan informasi pemilik bot
   * @command ./profil - Menampilkan profil pengguna
   * @command ./edit-bot-profile [nama] [deskripsi] - Mengedit profil bot
   * @command ./change-bot-name [nama_baru] - Mengubah nama bot
   * @command ./deactivate-bot - Menonaktifkan bot
   * @command ./activate-bot - Mengaktifkan bot
   * @command ./bot-status - Memeriksa status bot
   */
  if (!isGroupMessage) {
    if (lowerCaseBody === "!user") {
      if (user && user.type === "dev") {
        response = await handleUserCommand(client, number, user);
      } else {
        response = logMessages.errors.onlyDevCanUse;
      }
    } else if (lowerCaseBody.startsWith("./change-bot-name ")) {
      if (isUserAuthorized(userRole, "dev")) {
        const newName = message.body.split(" ")[1];
        response = await changeBotName(newName);
      } else {
        response = logMessages.errors.onlyDevCanUse;
      }
    } else if (
      message.caption &&
      message.caption.startsWith("./edit-profile-bot")
    ) {
      if (user && user.type === "dev") {
        const mediaData = await client.decryptFile(message);
        const mediaFilePath = path.resolve(
          __dirname,
          "../downloads",
          message.id + ".jpg"
        );
        fs.writeFileSync(mediaFilePath, mediaData);
        response = await editBotProfilePicture(client, mediaFilePath); // Tambahkan client sebagai argumen
      } else {
        response = logMessages.errors.onlyDevCanUse;
      }
    }
  }

  /**
   * Menangani perintah umum (berlaku untuk grup dan pesan pribadi)
   * @generalCommands
   * @command ./sticker - Membuat stiker dari gambar atau video
   * @command ./download [url] - Mengunduh konten dari URL yang diberikan
   * @command ./more-info - Menampilkan informasi tambahan
   * @command help [fitur] - Menampilkan bantuan untuk fitur tertentu
   * @command ./mal-[perintah] - Menjalankan perintah terkait MyAnimeList
   * @command ./pinterest [query] - Mencari gambar di Pinterest
   * @command ./wallpaper [query] - Mencari wallpaper
   * @command ./wikimedia [query] - Mencari gambar di Wikimedia
   * @command ./quotesanime - Menampilkan kutipan anime acak
   * @command ./ringtone [query] - Mencari ringtone
   * @command ./styletext [teks] - Mengubah gaya teks
   */
  if (!response) {
    if (message.caption && message.caption.startsWith("./sticker")) {
      try {
        await handleStickerCommand(client, message);
      } catch (error) {
        console.error("Error:", error);
        response = "Terjadi kesalahan saat memproses perintah ./sticker.";
      }
    } else if (lowerCaseBody === "!info") {
      response = getHelloMessage(userName);
    }else if (lowerCaseBody.startsWith("./download ")) {
      try {
        await handleDownloadCommand(client, message);
      } catch (error) {
        console.error("Error:", error);
        response = "Terjadi kesalahan saat memproses perintah ./download.";
      }
    } else if (lowerCaseBody === "./more-info") {
      try {
        response = await handleMoreInfoCommand();
      } catch (error) {
        response = "Terjadi kesalahan saat memproses perintah ./more-info.";
        console.error("Error:", error); // Tangkap dan cetak error
      }
    } else if (lowerCaseBody.startsWith("help ")) {
      const feature = lowerCaseBody.split(" ")[1];
      response = getFeatureHelp(feature);
    } else if (lowerCaseBody.startsWith("./mal-")) {
      try {
        await handleMalCommand(client, message, lowerCaseBody.slice(2));
      } catch (error) {
        console.error("Error:", error);
        response = "Terjadi kesalahan saat memproses perintah MyAnimeList.";
      }
      return;
    } else if (lowerCaseBody === "./owner") {
      try {
        response = await handleOwnerCommand();
      } catch (error) {
        response = "Terjadi kesalahan saat memproses perintah ./owner.";
        console.error("Error:", error); // Tangkap dan cetak error
      }
    } else if (lowerCaseBody.startsWith("./pinterest ")) {
      const query = lowerCaseBody.replace("./pinterest ", "");
      const results = await pinterest(query);
      response = `Hasil pencarian Pinterest untuk "${query}":\n\n${results
        .slice(0, 5)
        .join("\n")}`;
    } else if (lowerCaseBody.startsWith("./wallpaper ")) {
      const query = lowerCaseBody.replace("./wallpaper ", "");
      const results = await wallpaper(query);
      response = `Wallpaper untuk "${query}":\n\n${results
        .slice(0, 3)
        .map((w) => `Judul: ${w.title}\nTipe: ${w.type}\nSumber: ${w.source}`)
        .join("\n\n")}`;
    } else if (lowerCaseBody.startsWith("./wikimedia ")) {
      const query = lowerCaseBody.replace("./wikimedia ", "");
      const results = await wikimedia(query);
      response = `Hasil pencarian Wikimedia untuk "${query}":\n\n${results
        .slice(0, 3)
        .map((w) => `Judul: ${w.title}\nSumber: ${w.source}`)
        .join("\n\n")}`;
    } else if (lowerCaseBody === "./quotesanime") {
      const quote = await quotesAnime();
      response = `Kutipan Anime:\n\nKarakter: ${quote[0].karakter}\nAnime: ${quote[0].anime}\nEpisode: ${quote[0].episode}\nKutipan: "${quote[0].quotes}"`;
    } else if (lowerCaseBody.startsWith("./ringtone ")) {
      const query = lowerCaseBody.replace("./ringtone ", "");
      const results = await ringtone(query);
      response = `Ringtone untuk "${query}":\n\n${results
        .slice(0, 3)
        .map((r) => `Judul: ${r.title}\nSumber: ${r.source}\nAudio: ${r.audio}`)
        .join("\n\n")}`;
    } else if (lowerCaseBody.startsWith("./styletext ")) {
      const text = lowerCaseBody.replace("./styletext ", "");
      const results = await styletext(text);
      response = `Gaya teks untuk "${text}":\n\n${results
        .slice(0, 10)
        .map((s) => `${s.name}: ${s.result}`)
        .join("\n")}`;
    }
  }

  if (response && client && typeof client.sendText === "function") {
    console.log(`Sending response to: ${isGroupMessage ? groupId : number}`);
    if (isGroupMessage) {
      await client.reply(groupId, response, message.id.toString());
    } else {
      await client.sendText(number, response);
    }
  }

  processedMessages.delete(messageId);
};

module.exports = {
  handleIncomingMessage,
};

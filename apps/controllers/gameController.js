const fs = require('fs');
const path = require('path');

const gamesData = JSON.parse(fs.readFileSync(path.join(__dirname, './data/game.json'), 'utf8'));

// Objek untuk menyimpan state permainan untuk setiap pengguna
const gameStates = {};

/**
 * Menginisialisasi state permainan untuk pengguna tertentu
 * @param {string} chatId - ID chat pengguna
 * @param {string} gameType - Jenis permainan
 */
const initGameState = (chatId, gameType) => {
  gameStates[chatId] = {
    gameType,
    attempts: 0,
    maxAttempts: 5,
    clueGiven: false,
    question: null,
    answer: null,
    clue: null,
    isActive: true,
    filterMessages: false,
  };
};

/**
 * Mendapatkan pertanyaan acak untuk jenis permainan tertentu
 * @param {string} gameType - Jenis permainan
 * @returns {Object|null} Objek pertanyaan atau null jika tidak ada
 */
const getRandomQuestion = (gameType) => {
  const questions = gamesData[gameType];
  if (!questions || questions.length === 0) {
    console.error(`Tidak ada pertanyaan untuk tipe permainan: ${gameType}`);
    return null;
  }
  return questions[Math.floor(Math.random() * questions.length)];
};

/**
 * Memulai permainan baru
 * @param {string} chatId - ID chat pengguna
 * @param {string} gameType - Jenis permainan
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startGame = async (chatId, gameType) => {
  initGameState(chatId, gameType);
  const question = getRandomQuestion(gameType);
  if (!question) {
    return `Maaf, terjadi kesalahan saat memulai permainan ${gameType}. Silakan coba lagi nanti.`;
  }
  
  gameStates[chatId].question = question.pertanyaan || question.soal || question.petunjuk || question.lirik || question.deskripsi;
  gameStates[chatId].answer = question.jawaban || question.lanjutan;
  gameStates[chatId].clue = question.clue || "Maaf, tidak ada petunjuk tambahan.";

  if (!gameStates[chatId].question || !gameStates[chatId].answer) {
    console.error(`Data pertanyaan tidak valid untuk ${gameType}:`, question);
    return `Maaf, terjadi kesalahan saat memulai permainan ${gameType}. Silakan coba lagi nanti.`;
  }

  return `🎮 Permainan ${gameType} dimulai! 🎮\n\n` +
         `📝 Pertanyaan: ${gameStates[chatId].question}\n\n` +
         `ℹ️ Anda memiliki ${gameStates[chatId].maxAttempts} kesempatan untuk menjawab.\n` +
         `💡 Ketik ".menyerah" jika Anda ingin menyerah dan melihat jawabannya.`;
};

/**
 * Memeriksa jawaban pengguna
 * @param {string} chatId - ID chat pengguna
 * @param {string} userAnswer - Jawaban pengguna
 * @returns {Promise<string|null>} Pesan hasil pemeriksaan atau null
 */
const checkAnswer = async (chatId, userAnswer) => {
  const state = gameStates[chatId];
  if (!state || !state.isActive) {
    return null;
  }

  if (userAnswer.toLowerCase() === './filter-pesan') {
    state.filterMessages = !state.filterMessages;
    return state.filterMessages
      ? `✅ Filter pesan diaktifkan. Gunakan format '.jawab [jawaban Anda]' untuk menjawab.`
      : `❌ Filter pesan dinonaktifkan. Anda dapat menjawab langsung tanpa menggunakan '.jawab'.`;
  }

  let processedAnswer = userAnswer;

  if (state.filterMessages) {
    if (!userAnswer.toLowerCase().startsWith('.jawab ')) {
      return `❗ Filter pesan aktif. Gunakan format: .jawab [jawaban Anda]`;
    }
    processedAnswer = userAnswer.slice(7).trim(); // Menghapus '.jawab ' dari awal jawaban
  }

  if (processedAnswer.toLowerCase() === '.menyerah') {
    state.isActive = false;
    return `😔 Anda menyerah.\n\n` +
           `✅ Jawaban yang benar adalah: ${state.answer}\n\n` +
           `🔄 Ketik perintah untuk memulai permainan baru!`;
  }

  if (processedAnswer.toLowerCase() === './filter-pesan') {
    state.filterMessages = true;
    return `✅ Filter pesan diaktifkan. Hanya pesan yang mendekati jawaban akan direspon.`;
  }

  if (state.filterMessages) {
    const similarity = calculateSimilarity(processedAnswer.toLowerCase(), state.answer.toLowerCase());
    if (similarity < 0.5) {
      return null;
    }
  }

  if (processedAnswer.toLowerCase() === state.answer.toLowerCase()) {
    state.isActive = false;
    return `🎉 Selamat! Jawaban Anda benar! 🎉\n\n` +
           `✅ Jawaban: ${state.answer}\n\n` +
           `🔄 Ketik perintah untuk memulai permainan baru!`;
  }

  state.attempts++;
  const remainingAttempts = state.maxAttempts - state.attempts;

  const similarity = calculateSimilarity(processedAnswer.toLowerCase(), state.answer.toLowerCase());
  if (similarity > 0.7) {
    return `👀 Jawaban Anda sangat dekat! Coba lagi!`;
  }

  if (state.attempts === 4) {
    return `💪 Semangat! Kamu pasti bisa. Coba lagi!\n\n` +
           `🔢 Anda masih memiliki ${remainingAttempts} kesempatan lagi.\n` +
           `⏳ Silakan tunggu 5 detik sebelum mencoba lagi.`;
  }

  if (remainingAttempts === 0) {
    if (!state.clueGiven) {
      state.clueGiven = true;
      state.maxAttempts += 3;
      return `❗ Anda telah salah menjawab 5 kali.\n\n` +
             `💡 Ini petunjuk tambahan: ${state.clue}\n\n` +
             `🎁 Anda mendapatkan 3 kesempatan tambahan.\n` +
             `ℹ️ Silakan coba lagi!`;
    } else {
      state.isActive = false;
      return `😔 Maaf, Anda telah kehabisan kesempatan.\n\n` +
             `✅ Jawaban yang benar adalah: ${state.answer}\n\n` +
             `🔄 Ketik perintah untuk memulai permainan baru!`;
    }
  }

  return `❌ Maaf, jawaban Anda salah.\n\n` +
         `🔢 Anda masih memiliki ${remainingAttempts} kesempatan lagi.\n` +
         `⏳ Silakan tunggu 5 detik sebelum mencoba lagi.\n` +
         `💪 Ayo coba lagi!`;
};

/**
 * Menghitung kesamaan antara dua string
 * @param {string} str1 - String pertama
 * @param {string} str2 - String kedua
 * @returns {number} Nilai kesamaan antara 0 dan 1
 */
const calculateSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1 - matrix[len1][len2] / Math.max(len1, len2);
};

/**
 * Memulai permainan Tebak Kata
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startTebakKata = async (chatId) => {
  return startGame(chatId, 'tebakKata');
};

/**
 * Memulai permainan Tic Tac Toe
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startTicTacToe = async (chatId) => {
  return `🎲 Permainan Tic Tac Toe\n\n${await startGame(chatId, 'ticTacToe')}`;
};

/**
 * Memulai permainan Matematika
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startMathGame = async (chatId) => {
  return `🧮 Permainan Matematika\n\n${await startGame(chatId, 'mathGame')}`;
};

/**
 * Memulai permainan Tebak Lirik
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startTebakLirik = async (chatId) => {
  return `🎵 Permainan Tebak Lirik\n\n${await startGame(chatId, 'tebakLirik')}`;
};

/**
 * Memulai permainan Teka-Teki
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startTekaTeki = async (chatId) => {
  return `🧩 Permainan Teka-Teki\n\n${await startGame(chatId, 'tekaTeki')}`;
};

/**
 * Memulai permainan Asah Otak
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startAsahOtak = async (chatId) => {
  return `🧠 Permainan Asah Otak\n\n${await startGame(chatId, 'asahOtak')}`;
};

/**
 * Memulai permainan Family 100
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startFamily100 = async (chatId) => {
  return `👨‍👩‍👧‍👦 Permainan Family 100\n\n${await startGame(chatId, 'family100')}`;
};

/**
 * Memulai permainan Siapakah Aku
 * @param {string} chatId - ID chat pengguna
 * @returns {Promise<string>} Pesan permainan dimulai
 */
const startSiapakahAku = async (chatId) => {
  return `🎭 Permainan Siapakah Aku\n\n${await startGame(chatId, 'siapakahAku')}`;
};

/**
 * Memulai countdown untuk memungkinkan pengguna mencoba lagi
 * @param {string} chatId - ID chat pengguna
 * @param {Function} callback - Fungsi yang akan dipanggil setelah countdown selesai
 */
function startCountdown(chatId, callback) {
  setTimeout(() => {
    const state = gameStates[chatId];
    if (state && state.isActive) {
      callback();
    }
  }, 5000);
}

module.exports = {
  startTebakKata,
  startTicTacToe,
  startMathGame,
  startTebakLirik,
  startTekaTeki,
  startAsahOtak,
  startFamily100,
  startSiapakahAku,
  checkAnswer,
  startCountdown,
};
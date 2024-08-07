const fs = require('fs');
const path = require('path');
const { quotesAnime } = require('./scrapper');

const dailyQuoteFilePath = path.join(__dirname, 'dailyQuote.json');

/**
 * Memuat kutipan harian dari file
 * @returns {Object} Objek kutipan harian atau objek kosong jika file tidak ada
 */
const loadDailyQuote = () => {
  if (fs.existsSync(dailyQuoteFilePath)) {
    const rawData = fs.readFileSync(dailyQuoteFilePath);
    return JSON.parse(rawData);
  }
  return {};
};

/**
 * Menyimpan kutipan harian ke file
 * @param {Object} quote - Objek kutipan harian untuk disimpan
 */
const saveDailyQuote = (quote) => {
  const data = JSON.stringify(quote);
  fs.writeFileSync(dailyQuoteFilePath, data);
};

/**
 * Mendapatkan kutipan harian untuk hari ini atau mengambil yang baru jika belum ada
 * @returns {Promise<Object>} Kutipan harian
 */
const getDailyQuote = async () => {
  const today = new Date().toISOString().split('T')[0];
  let dailyQuote = loadDailyQuote();

  if (dailyQuote.date !== today) {
    const quotes = await quotesAnime();
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    dailyQuote = { date: today, quote: randomQuote };
    saveDailyQuote(dailyQuote);
  }

  return dailyQuote.quote;
};

module.exports = {
  getDailyQuote,
};
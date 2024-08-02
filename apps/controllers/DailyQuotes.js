const fs = require('fs');
const path = require('path');
const { quotesAnime } = require('./scrapper');

const dailyQuoteFilePath = path.join(__dirname, 'dailyQuote.json');

// Load daily quote from file
const loadDailyQuote = () => {
  if (fs.existsSync(dailyQuoteFilePath)) {
    const rawData = fs.readFileSync(dailyQuoteFilePath);
    return JSON.parse(rawData);
  }
  return {};
};

// Save daily quote to file
const saveDailyQuote = (quote) => {
  const data = JSON.stringify(quote);
  fs.writeFileSync(dailyQuoteFilePath, data);
};

// Get today's quote or fetch a new one
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

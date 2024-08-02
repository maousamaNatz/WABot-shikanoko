const axios = require('axios');
const cheerio = require('cheerio');

const searchWikipedia = async (query, lang = 'id') => {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);

    const firstResult = $('li.mw-search-result a').first().attr('href');
    if (!firstResult) {
      return { title: '', content: 'Hasil tidak ditemukan.', url: '' };
    }

    const pageUrl = `https://${lang}.wikipedia.org${firstResult}`;
    const { data: pageData } = await axios.get(pageUrl);
    const $$ = cheerio.load(pageData);

    const title = $$('#firstHeading').text();
    const paragraphs = $$('#mw-content-text .mw-parser-output > p');
    let content = '';

    paragraphs.each((index, element) => {
      const paragraphText = $$(element).text().trim();
      if (paragraphText) {
        content += `${paragraphText}\n\n`;
      }
    });

    return {
      title: title,
      content: content.trim() ? content.trim() : 'Konten tidak ditemukan.',
      url: pageUrl
    };
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    throw new Error('Terjadi kesalahan saat mencari di Wikipedia.');
  }
};

const summarizeContent = (content) => {
  const sentences = content.split('. ');
  const summaryLength = Math.ceil(sentences.length / 3);
  const summary = sentences.slice(0, summaryLength).join('. ') + '.';
  return summary;
};

module.exports = { searchWikipedia, summarizeContent };

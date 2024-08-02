// controllers/MalController.js

const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const handleMalCommand = async (client, message, command) => {
  try {
    const baseUrl = "https://api.jikan.moe/v4";
    let response = "";

    if (command.includes('all')) {
      const type = command.includes('komik') ? 'manga' : 'anime';
      let itemList = [];
      let page = 1;

      while (true) {
        const res = await axios.get(`${baseUrl}/${type}?page=${page}`);
        itemList = itemList.concat(res.data.data);
        if (!res.data.pagination.has_next_page) {
          break;
        }
        page++;
      }

      const formattedItemList = itemList.map(item => ({
        title: item.title,
        score: item.score ? item.score.toFixed(2) : "**N/A**",
        chapters: item.chapters || "**N/A**",
        episodes: item.episodes || "**N/A**",
        type: item.type,
        status: item.status,
      }));

      const ws = xlsx.utils.json_to_sheet(formattedItemList);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `${type} List`);
      
      const filePath = path.join(__dirname, `../downloads/${type}_list_all.xlsx`);
      xlsx.writeFile(wb, filePath);

      await client.sendFile(message.from, filePath, `${type}_list_all.xlsx`, `Here is the ${type} list you requested.`);
    } else {
      const [ , malType, seasonOrGenre, year ] = command.split('-');
      const type = malType.includes('komik') ? 'manga' : 'anime';
      const query = seasonOrGenre ? `&genres=${seasonOrGenre}` : '';
      const res = await axios.get(`${baseUrl}/${type}?year=${year}${query}`);
      const itemList = res.data.data.slice(0, 12);

      response += `Berikut adalah permintaan anda\n${year}\n\n`;

      itemList.forEach(item => {
        response += `============\n`;
        response += `judul: ${item.title}\n`;
        response += `score: ${item.score ? item.score.toFixed(2) : "**N/A**"}\n`;

        if (type === 'manga') {
          response += `chapter: ${item.chapters || "**N/A**"}\n`;
        } else {
          if (item.type === 'Movie') {
            response += `movie\n`;
          } else {
            response += `episode: ${item.episodes || "**N/A**"}\n`;
          }
        }

        response += `============\n`;
      });

      response += "\nJika anda ingin melihat semua list silahkan kunjungi MyAnimeList";
      await client.sendText(message.from, response);
    }
  } catch (error) {
    console.error('Error handling MAL command:', error);
    await client.sendText(message.from, 'Maaf, terjadi kesalahan saat memproses permintaan Anda.');
  }
};

module.exports = {
  handleMalCommand,
};

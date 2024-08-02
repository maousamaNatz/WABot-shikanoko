const axios = require("axios");
const cheerio = require("cheerio");
const wikipedia = require("wikipedia"); // Perlu ditambahkan untuk pencarian Wikipedia

/**
 * Fungsi untuk mencari Wikipedia.
 * @param {string} query - Kata kunci pencarian.
 * @param {string} [lang="en"] - Bahasa pencarian (default: "en").
 * @returns {Promise<Object>} Objek yang berisi judul, konten, dan URL halaman Wikipedia.
 * @throws Akan menimbulkan kesalahan jika pencarian Wikipedia gagal.
 */
async function searchWikipedia(query, lang = "en") {
  try {
    wikipedia.setLang(lang);
    const page = await wikipedia.page(query);
    const summary = await page.summary();
    return {
      title: summary.title,
      content: summary.extract,
      url: page.fullurl,
    };
  } catch (error) {
    throw new Error(`Kesalahan saat mencari di Wikipedia: ${error.message}`);
  }
}

/**
 * Fungsi untuk mencari di Pinterest.
 * @param {string} query - Kata kunci pencarian.
 * @returns {Promise<Array<string>>} Array URL gambar hasil pencarian.
 * @throws Akan menimbulkan kesalahan jika pencarian Pinterest gagal.
 */
function pinterest(query) {
  return new Promise(async (resolve, reject) => {
    axios
      .get("https://id.pinterest.com/search/pins/?autologin=true&q=" + query, {
        headers: {
          cookie:
            '_auth=1; _b="AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg="; _pinterest_sess=...',
        },
      })
      .then(({ data }) => {
        const $ = cheerio.load(data);
        const result = [];
        const hasil = [];
        $("div > a")
          .get()
          .map((b) => {
            const link = $(b).find("img").attr("src");
            result.push(link);
          });
        result.forEach((v) => {
          if (v == undefined) return;
          hasil.push(v.replace(/236/g, "736"));
        });
        hasil.shift();
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari wallpaper.
 * @param {string} title - Kata kunci pencarian.
 * @param {string} [page="1"] - Halaman pencarian (default: "1").
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi wallpaper.
 * @throws Akan menimbulkan kesalahan jika pencarian wallpaper gagal.
 */
function wallpaper(title, page = "1") {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`
      )
      .then(({ data }) => {
        let $ = cheerio.load(data);
        let hasil = [];
        $("div.grid-item").each(function (a, b) {
          hasil.push({
            title: $(b).find("div.info > a > h3").text(),
            type: $(b).find("div.info > a:nth-child(2)").text(),
            source:
              "https://www.besthdwallpaper.com/" +
              $(b).find("div > a:nth-child(3)").attr("href"),
            image: [
              $(b).find("picture > img").attr("data-src") ||
                $(b).find("picture > img").attr("src"),
              $(b).find("picture > source:nth-child(1)").attr("srcset"),
              $(b).find("picture > source:nth-child(2)").attr("srcset"),
            ],
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari gambar di Wikimedia.
 * @param {string} title - Kata kunci pencarian.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi gambar di Wikimedia.
 * @throws Akan menimbulkan kesalahan jika pencarian Wikimedia gagal.
 */
function wikimedia(title) {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://commons.wikimedia.org/w/index.php?search=${title}&title=Special:MediaSearch&go=Go&type=image`
      )
      .then((res) => {
        let $ = cheerio.load(res.data);
        let hasil = [];
        $(".sdms-search-results__list-wrapper > div > a").each(function (a, b) {
          hasil.push({
            title: $(b).find("img").attr("alt"),
            source: $(b).attr("href"),
            image:
              $(b).find("img").attr("data-src") || $(b).find("img").attr("src"),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari kutipan anime.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi kutipan anime.
 * @throws Akan menimbulkan kesalahan jika pencarian kutipan anime gagal.
 */
function quotesAnime() {
  return new Promise((resolve, reject) => {
    const page = Math.floor(Math.random() * 184);
    axios
      .get("https://otakotaku.com/quote/feed/" + page)
      .then(({ data }) => {
        const $ = cheerio.load(data);
        const hasil = [];
        $("div.kotodama-list").each(function (l, h) {
          hasil.push({
            link: $(h).find("a").attr("href"),
            gambar: $(h).find("img").attr("data-src"),
            karakter: $(h).find("div.char-name").text().trim(),
            anime: $(h).find("div.anime-title").text().trim(),
            episode: $(h).find("div.meta").text(),
            up_at: $(h).find("small.meta").text(),
            quotes: $(h).find("div.quote").text().trim(),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mengunduh video menggunakan aiovideodl.
 * @param {string} link - URL video yang akan diunduh.
 * @returns {Promise<Object>} Objek yang berisi informasi video yang diunduh.
 * @throws Akan menimbulkan kesalahan jika pengunduhan video gagal.
 */
function aiovideodl(link) {
  return new Promise((resolve, reject) => {
    axios({
      url: "https://aiovideodl.ml/",
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        cookie:
          "PHPSESSID=69ce1f8034b1567b99297eee2396c308; _ga=GA1.2.1360894709.1632723147; _gid=GA1.2.1782417082.1635161653",
      },
    })
      .then((src) => {
        let a = cheerio.load(src.data);
        let token = a("#token").attr("value");
        axios({
          url: "https://aiovideodl.ml/wp-json/aio-dl/video-data/",
          method: "POST",
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            cookie:
              "PHPSESSID=69ce1f8034b1567b99297eee2396c308; _ga=GA1.2.1360894709.1632723147; _gid=GA1.2.1782417082.1635161653",
          },
          data: new URLSearchParams(
            Object.entries({ url: link, token: token })
          ),
        })
          .then(({ data }) => {
            resolve(data);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk scrapper artikel umma.
 * @param {string} url - URL artikel yang akan di-scrape.
 * @returns {Promise<Object>} Objek yang berisi informasi artikel.
 * @throws Akan menimbulkan kesalahan jika scrapping artikel gagal.
 */
function umma(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((res) => {
        let $ = cheerio.load(res.data);
        let image = [];
        $("#article-content > div")
          .find("img")
          .each(function (a, b) {
            image.push($(b).attr("src"));
          });
        let hasil = {
          title: $("#wrap > div.content-container.font-6-16 > h1")
            .text()
            .trim(),
          author: {
            name: $(
              "#wrap > div.content-container.font-6-16 > div.content-top > div > div.user-ame.font-6-16.fw"
            )
              .text()
              .trim(),
            profilePic: $(
              "#wrap > div.content-container.font-6-16 > div.content-top > div > div.profile-photo > img.photo"
            ).attr("src"),
          },
          caption: $("#article-content > div > p").text().trim(),
          media: $("#article-content > div > iframe").attr("src")
            ? [$("#article-content > div > iframe").attr("src")]
            : image,
          type: $("#article-content > div > iframe").attr("src")
            ? "video"
            : "image",
          like: $(
            "#wrap > div.bottom-btns > div > button:nth-child(1) > div.text.font-6-12"
          ).text(),
        };
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk mencari ringtone.
 * @param {string} title - Kata kunci pencarian.
 * @returns {Promise<Array<Object>>} Array objek yang berisi informasi ringtone.
 * @throws Akan menimbulkan kesalahan jika pencarian ringtone gagal.
 */
function ringtone(title) {
  return new Promise((resolve, reject) => {
    axios
      .get("https://meloboom.com/en/search/" + title)
      .then((get) => {
        let $ = cheerio.load(get.data);
        let hasil = [];
        $(
          "#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li"
        ).each(function (a, b) {
          hasil.push({
            title: $(b).find("h4").text(),
            source: "https://meloboom.com/" + $(b).find("a").attr("href"),
            audio: $(b).find("audio").attr("src"),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

/**
 * Fungsi untuk style teks.
 * @param {string} teks - Teks yang akan diubah gayanya.
 * @returns {Promise<Array<Object>>} Array objek yang berisi nama gaya dan hasil teks.
 * @throws Akan menimbulkan kesalahan jika gaya teks gagal.
 */
function styletext(teks) {
  return new Promise((resolve, reject) => {
    axios
      .get("http://qaz.wtf/u/convert.cgi?text=" + teks)
      .then(({ data }) => {
        let $ = cheerio.load(data);
        let hasil = [];
        $("table > tbody > tr").each(function (a, b) {
          hasil.push({
            name: $(b).find("td:nth-child(1) > span").text(),
            result: $(b).find("td:nth-child(2)").text().trim(),
          });
        });
        resolve(hasil);
      })
      .catch(reject);
  });
}

module.exports = {
  pinterest,
  wallpaper,
  wikimedia,
  quotesAnime,
  aiovideodl,
  umma,
  ringtone,
  styletext,
  searchWikipedia,
};

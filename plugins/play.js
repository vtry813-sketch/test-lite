const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

cmd({
    pattern: "play",
    desc: "Download music from Tubidy",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name!");

        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        // 1. Search Tubidy
        const searchUrl = `https://tubidy.cool/search.php?q=${encodeURIComponent(q)}`;
        const { data: searchHtml } = await axios.get(searchUrl);
        const $ = cheerio.load(searchHtml);

        // Get the link to the first search result
        const firstResult = $('.media-list .media-body a').first().attr('href');
        const songTitle = $('.media-list .media-body a').first().text().trim();

        if (!firstResult) return reply("❌ Song not found on Tubidy.");

        // 2. Go to the download page
        const downloadPageUrl = `https://tubidy.cool/${firstResult}`;
        const { data: downloadHtml } = await axios.get(downloadPageUrl);
        const $$ = cheerio.load(downloadHtml);

        // Find the MP3 download link (usually the first 'Audio' link)
        const downloadUrl = $$('a:contains("MP3 Audio")').attr('href');

        if (!downloadUrl) return reply("❌ Failed to fetch the download link.");

        // 3. Send the Audio
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: "POPKID-MD TUBIDY PLAYER",
                    mediaType: 1,
                    sourceUrl: searchUrl,
                    showAdAttribution: true,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});

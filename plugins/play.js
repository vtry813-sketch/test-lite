const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "play",
    desc: "Fast McTwize downloader",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name!");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const searchUrl = `https://mctwize.co.za/search?q=${encodeURIComponent(q)}`;

        const { data } = await axios.get(searchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            }
        });

        const $ = cheerio.load(data);

        // 🔥 DIRECTLY get first /download/ link
        const firstDownload = $('a[href^="/download/"]').first();

        if (!firstDownload.length) {
            return reply("❌ Song not found on McTwize.");
        }

        let downloadPath = firstDownload.attr("href");
        let title = firstDownload.text().trim() || q;

        // Make full link
        const finalUrl = `https://mctwize.co.za${downloadPath}`;

        // Send audio directly
        await conn.sendMessage(
            from,
            {
                audio: { url: finalUrl },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`,
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (err) {
        console.error(err);
        reply(`❌ Error: ${err.message}`);
    }
});

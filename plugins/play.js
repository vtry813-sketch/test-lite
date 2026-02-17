const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download song from YouTube",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {

    if (!q) return reply("❌ Please provide a YouTube link or title");

    try {

        const start = Date.now();

        await conn.sendMessage(from, { 
            react: { text: "🎶", key: mek.key } 
        });

        // Fetch from Jawad API
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(api);

        if (!data.status) return reply("❌ Failed to fetch song");

        const title = data.result.title;
        const mp3 = data.result.mp3;

        const end = Date.now();

        await conn.sendMessage(from, {
            audio: { url: mp3 },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            caption: `🎵 *Title:* ${title}\n🚀 *Speed:* ${end - start}ms`
        }, { quoted: m });

    } catch (err) {
        console.log(err);
        reply("❌ Error downloading song");
    }

});

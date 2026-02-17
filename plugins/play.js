const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search'); // Adds search capability

cmd({
    pattern: "play",
    desc: "Download music by name or link",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a song name or YouTube link! 🎵");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search for the video if 'q' is not a link
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("No results found! ❌");

        const videoUrl = data.url;

        // 2. Call your API with the found URL
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(videoUrl)}&format=mp3`;
        const response = await axios.get(apiUrl);
        
        if (!response.data.success) {
            return reply("❌ API Error: Could not generate download link.");
        }

        // 3. Send the Audio
        await conn.sendMessage(from, {
            audio: { url: response.data.downloadURL },
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: data.title,
                    body: "Popkid AI - Download Successful",
                    thumbnailUrl: data.thumbnail,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.response?.status || e.message}`);
    }
});

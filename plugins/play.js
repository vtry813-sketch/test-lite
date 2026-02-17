const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play",
    alias: ["song", "music"],
    use: ".play <song name>",
    react: "🎶",
    desc: "Search and download audio from YouTube.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("📍 *Please provide a song name or YouTube link.*");

        // 1. Search YouTube for the best result
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("❌ No results found.");

        const videoUrl = data.url;

        // 2. Fetch the download link using Axios
        const response = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`);
        const downloadData = response.data;

        if (!downloadData.status || !downloadData.result.mp3) {
            return reply("❌ Failed to fetch audio link from the server.");
        }

        // 3. Simple Modern Info Message
        const infoMsg = `
✨ *POPKID-XD PLAYER* ✨

🎵 *Title:* ${downloadData.result.title}
👤 *Channel:* ${data.author.name}
🕒 *Duration:* ${data.timestamp}
🔗 *Link:* ${videoUrl}

> *Downloading audio, please wait...*
        `.trim();

        // Send thumbnail and details first
        await conn.sendMessage(from, { 
            image: { url: data.thumbnail }, 
            caption: infoMsg 
        }, { quoted: mek });

        // 4. Send the Audio File (Standard MP3)
        await conn.sendMessage(from, { 
            audio: { url: downloadData.result.mp3 }, 
            mimetype: "audio/mpeg",
            fileName: `${downloadData.result.title}.mp3`
        }, { quoted: mek });

        // Final reaction for success
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("Play Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply(`❌ *Error:* ${e.response?.data?.message || e.message || "Could not process request."}`);
    }
});

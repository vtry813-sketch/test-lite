const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download and play audio from YouTube",
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("Please provide a YouTube URL! 🔗");

        // React with a loading icon (Matching your ping.js style)
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Encode the URL to prevent 500 errors
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await reply("❌ Error: API could not process this link.");
        }

        const { title, mp3 } = data.result;

        // Send the audio file with a caption
        await conn.sendMessage(from, { 
            audio: { url: mp3 }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            caption: `🎵 *Now Playing:* ${title}\n\n*Downloaded via Jawad-Tech*`
        }, { quoted: mek });

        // Final success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ *Error:* ${e.response?.status === 500 ? "Server Error (500). Try again in a moment." : e.message}`);
    }
});

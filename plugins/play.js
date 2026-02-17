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

        // React with a loading icon
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Fetch data from the API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status) {
            return await reply("❌ Error: Could not find the video. Make sure the link is valid.");
        }

        const { title, mp3 } = data.result;

        // Send the audio file
        await conn.sendMessage(from, { 
            audio: { url: mp3 }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        // React with success
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log(e);
        await reply(`❌ An error occurred: ${e.message}`);
    }
});

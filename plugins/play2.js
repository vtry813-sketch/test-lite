const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "play",
    desc: "Download & send YouTube audio (mp3)",
    category: "music",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {
    const start = Date.now();
    const text = m.text.split(" ").slice(1).join(" ");

    if (!text) {
        return reply("❗️ Send a YouTube link or query after *play*");
    }

    // React ⚡
    await conn.sendMessage(from, { react: { text: "📡", key: mek.key }});

    try {
        // Convert user query or URL → YouTube URL
        let videoUrl = text;
        if (!videoUrl.startsWith("http")) {
            return reply("⚠️ Please send a valid YouTube link");
        }

        // Encode and call the Gifted API
        const apiUrl = `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;

        const res = await fetch(apiUrl);
        const json = await res.json();

        if (!json || !json.result) {
            return reply("❌ Failed to fetch audio. Make sure the link is correct.");
        }

        const mp3Url = json.result; // Expect direct mp3 link

        const speed = Date.now() - start;

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: mp3Url },
            mimetype: "audio/mpeg"
        });

        return reply(`🎧 *Downloaded!* \n🚀 Speed: ${speed}ms`);
    } catch (err) {
        console.error(err);
        return reply("❗️ Error while downloading audio");
    }
});

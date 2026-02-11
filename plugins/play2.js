const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');

cmd({
    pattern: "play3",
    desc: "Download YouTube song (mp3)",
    category: "music",
    react: "🎵",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {

    const start = Date.now();
    const query = m.text.split(" ").slice(1).join(" ");

    if (!query) return reply("❗ Send a song name or YouTube link");

    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    try {
        let videoUrl = query;
        let title = "";
        let thumbnail = "";

        // 🔍 Search YouTube if not link
        if (!query.startsWith("http")) {
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ Song not found");

            const video = search.videos[0];
            videoUrl = video.url;
            title = video.title;
            thumbnail = video.thumbnail;
        }

        // 🎵 Get download link from Gifted
        const apiUrl = `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(apiUrl);
        const json = await res.json();

        if (!json.success || !json.result) {
            return reply("❌ Failed to download audio");
        }

        const { download_url } = json.result;

        // ✅ IMPORTANT: download file buffer
        const audioBuffer = await fetch(download_url).then(r => r.buffer());

        const speed = Date.now() - start;

        // preview message
        await conn.sendMessage(from, {
            image: { url: thumbnail || json.result.thumbnail },
            caption: `🎧 *${title || json.result.title}*\n⚡ Speed: ${speed}ms`
        });

        // ✅ send real audio file
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${title || json.result.title}.mp3`,
            ptt: false
        });

    } catch (err) {
        console.error(err);
        reply("❗ Error while downloading audio");
    }
});

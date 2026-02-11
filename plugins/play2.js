const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');

cmd({
    pattern: "play2",
    desc: "Play song (YouTube → MP3)",
    category: "music",
    react: "🎵",
    filename: __filename
}, async (conn, m, mek, { from, reply }) => {

    const start = Date.now();
    const query = m.text.split(" ").slice(1).join(" ").trim();

    if (!query) return reply("❗ Send a song name or YouTube link");

    // ping-style reaction
    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    try {
        let videoUrl = query;
        let title = "";
        let thumbnail = "";

        // 🔎 If not a link → search YouTube locally
        if (!/^https?:\/\//i.test(query)) {
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ Song not found");
            const v = search.videos[0];
            videoUrl = v.url;
            title = v.title;
            thumbnail = v.thumbnail;
        }

        // 🎧 Gifted ytmp3 (128kbps)
        const api = `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}&quality=128kbps`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json.success || !json.result || !json.result.download_url) {
            return reply("❌ Failed to fetch audio");
        }

        const { download_url } = json.result;

        // ✅ download real MP3 buffer (fixes WhatsApp audio error)
        const audioBuffer = await fetch(download_url).then(r => r.buffer());

        const speed = Date.now() - start;

        // preview card (simple premium)
        await conn.sendMessage(from, {
            image: { url: thumbnail || json.result.thumbnail },
            caption: `🎧 *${title || json.result.title}*\n⚡ Speed: ${speed}ms`
        });

        // send playable audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${title || json.result.title}.mp3`,
            ptt: false
        });

    } catch (e) {
        console.error(e);
        reply("❗ Error while processing audio");
    }
});

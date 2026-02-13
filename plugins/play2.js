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

    if (!query) return reply("❗ Please send a song name or YouTube link.");

    // 📡 Loading reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    try {

        let videoUrl;
        let title;
        let thumbnail;
        let duration;
        let views;

        // =========================
        // 🔎 SEARCH IF NOT LINK
        // =========================
        if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(query)) {

            const search = await yts(query);

            if (!search.videos || !search.videos.length)
                return reply("❌ No results found for your query.");

            const v = search.videos[0];

            videoUrl = v.url;
            title = v.title;
            thumbnail = v.thumbnail;
            duration = v.timestamp;
            views = v.views?.toLocaleString() || "Unknown";

        } else {
            videoUrl = query;
        }

        // =========================
        // 🎧 DOWNLOAD FROM API
        // =========================

        const api = `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}&quality=128kbps`;

        const res = await fetch(api);
        const json = await res.json();

        if (!json.success || !json.result?.download_url)
            return reply("❌ Failed to fetch audio from server.");

        const downloadUrl = json.result.download_url;

        title = title || json.result.title || "Unknown Title";
        thumbnail = thumbnail || json.result.thumbnail;
        duration = duration || json.result.duration || "Unknown";

        // Clean filename
        const safeFileName = title.replace(/[^\w\s]/gi, '').slice(0, 60);

        // =========================
        // 📥 DOWNLOAD AUDIO BUFFER
        // =========================

        const audioBuffer = await fetch(downloadUrl).then(r => r.buffer());

        const speed = Date.now() - start;

        // =========================
        // 🎨 MODERN PREVIEW CARD
        // =========================

        const caption = `
╭━━━〔 🎧  MUSIC PLAYER 〕━━━⊷
┃ 🎵 *Title:* ${title}
┃ ⏱️ *Duration:* ${duration}
┃ 👁️ *Views:* ${views || "Unknown"}
┃ ⚡ *Speed:* ${speed}ms
╰━━━━━━━━━━━━━━━━━━⊷

> Powered by ${config.BOT_NAME || "POP KID-MD"} 🇰🇪
        `.trim();

        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption
        });

        // =========================
        // 🎶 SEND PLAYABLE AUDIO
        // =========================

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${safeFileName}.mp3`,
            ptt: false
        });

        // ✅ Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❗ Error while processing your audio request.");
    }
});

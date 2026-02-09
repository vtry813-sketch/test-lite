const { cmd } = require('../command');
const axios = require('axios');

// helper to get buffer
async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return res.data;
}

cmd({
    pattern: "play",
    desc: "Download song from YouTube",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Please provide a song name or YouTube link");

    try {
        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });

        // 🔎 Use deline API for searching
        let apiSearch;
        if (/^https?:\/\//.test(q)) {
            // User provided a link
            apiSearch = `https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(q)}`;
        } else {
            // User provided a name
            apiSearch = `https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(q)}`;
        }

        const searchRes = await axios.get(apiSearch);
        if (!searchRes.data || !searchRes.data.status || !searchRes.data.result) {
            return reply("❌ No results found");
        }

        const video = searchRes.data.result;

        // Use deline API to get mp3/audio
        const apiAudio = `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
        const audioBuffer = await getBuffer(apiAudio);

        const timeTag = Date.now();

        const buttons = [
            { buttonId: `aud1_${timeTag}`, buttonText: { displayText: "Audio 🎶" }, type: 1 },
            { buttonId: `aud2_${timeTag}`, buttonText: { displayText: "Voice 🔉" }, type: 1 },
            { buttonId: `aud3_${timeTag}`, buttonText: { displayText: "Document 📄" }, type: 1 }
        ];

        const buttonMessage = {
            image: { url: video.thumbnail },
            caption: `🎵 *${video.title}*\n⏱ ${video.duration || "Unknown"}\n\nSelect download format:`,
            footer: "POPKID MD",
            buttons: buttons,
            headerType: 4
        };

        const sentMsg = await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Button handler
        conn.ev.on("messages.upsert", async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg.message) return;

                const btn = msg.message.buttonsResponseMessage;
                if (!btn) return;

                if (msg.key.remoteJid !== from) return;

                const id = btn.selectedButtonId;
                if (!id.endsWith(`_${timeTag}`)) return;

                await conn.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

                if (id.startsWith("aud1")) {
                    // Audio
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: msg });

                } else if (id.startsWith("aud2")) {
                    // Voice note
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true
                    }, { quoted: msg });

                } else if (id.startsWith("aud3")) {
                    // Document
                    await conn.sendMessage(from, {
                        document: audioBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${video.title}.mp3`.replace(/[^\w\s.-]/gi, "")
                    }, { quoted: msg });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error(e);
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ Failed to download song.");
    }
});

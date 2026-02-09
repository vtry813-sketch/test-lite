const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return res.data;
}

cmd({
    pattern: "play",
    desc: "Download song from YouTube",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, react }) => {

    if (!q) return reply("❌ Please provide a song name or YouTube link");

    try {
        await react("🎶");

        const apiSearch = `https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(apiSearch);

        if (!searchRes.data?.status || !searchRes.data?.result) {
            return reply("❌ No results found");
        }

        const video = searchRes.data.result;
        const apiAudio = `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
        const audioBuffer = await getBuffer(apiAudio);

        const timeTag = Date.now();

        // 🔥 SEND BUTTONS (same system as your working play)
        await sendButtons(conn, from, {
            title: "POPKID MD SONG DOWNLOADER",
            text: `⿻ *Title:* ${video.title}\n⿻ *Duration:* ${video.duration || "Unknown"}\n\n*Select download format:*`,
            footer: "POPKID MD",
            image: video.thumbnail,
            buttons: [
                { id: `aud1_${timeTag}`, text: "Audio 🎶" },
                { id: `aud2_${timeTag}`, text: "Voice Message 🔉" },
                { id: `aud3_${timeTag}`, text: "Audio Document 📄" }
            ]
        });

        const handleResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const templateButtonReply = messageData.message?.templateButtonReplyMessage;
            if (!templateButtonReply) return;

            const selectedButtonId = templateButtonReply.selectedId;
            if (messageData.key.remoteJid !== from) return;
            if (!selectedButtonId.includes(`_${timeTag}`)) return;

            await react("⬇️");

            try {
                const type = selectedButtonId.split("_")[0];

                if (type === "aud1") {
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: messageData });

                } else if (type === "aud2") {
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true
                    }, { quoted: messageData });

                } else if (type === "aud3") {
                    await conn.sendMessage(from, {
                        document: audioBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${video.title}.mp3`.replace(/[^\w\s.-]/gi, "")
                    }, { quoted: messageData });
                }

                await react("✅");
                conn.ev.off("messages.upsert", handleResponse);

            } catch (err) {
                console.error(err);
                await react("❌");
            }
        };

        conn.ev.on("messages.upsert", handleResponse);

        setTimeout(() => {
            conn.ev.off("messages.upsert", handleResponse);
        }, 120000);

    } catch (e) {
        console.error(e);
        reply("❌ Failed to download song.");
    }
});

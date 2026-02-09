const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return res.data;
}

cmd({
    pattern: "spplay",
    desc: "Download song from Spotify",
    category: "downloader",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, react }) => {

    if (!q) return reply("❌ Please provide a song name");

    try {
        await react("🎧");

        const api = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(q)}`;
        const res = await axios.get(api);

        if (!res.data?.status || !res.data?.result) {
            return reply("❌ Song not found");
        }

        const data = res.data.result;
        const meta = data.metadata;
        const audioBuffer = await getBuffer(data.dlink);

        const timeTag = Date.now();

        await sendButtons(conn, from, {
            title: "POPKID MD SPOTIFY DOWNLOADER",
            text:
`⿻ *Title:* ${meta.title}
⿻ *Artist:* ${meta.artist}
⿻ *Duration:* ${meta.duration}

*Select download format:*`,
            footer: "POPKID MD",
            image: meta.cover,
            buttons: [
                { id: `sp1_${timeTag}`, text: "Audio 🎶" },
                { id: `sp2_${timeTag}`, text: "Voice Message 🔉" },
                { id: `sp3_${timeTag}`, text: "Audio Document 📄" },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Open Spotify",
                        url: meta.url || "https://spotify.com"
                    })
                }
            ]
        });

        const handleResponse = async (event) => {
            const msg = event.messages[0];
            if (!msg.message) return;

            const btn = msg.message?.templateButtonReplyMessage;
            if (!btn) return;

            const id = btn.selectedId;
            if (msg.key.remoteJid !== from) return;
            if (!id.includes(`_${timeTag}`)) return;

            await react("⬇️");

            try {
                const type = id.split("_")[0];

                if (type === "sp1") {
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: msg });

                } else if (type === "sp2") {
                    await conn.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true
                    }, { quoted: msg });

                } else if (type === "sp3") {
                    await conn.sendMessage(from, {
                        document: audioBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${meta.title}.mp3`.replace(/[^\w\s.-]/gi, "")
                    }, { quoted: msg });
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

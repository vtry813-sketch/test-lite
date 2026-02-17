const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

// API Engine
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';

cmd({
    pattern: "play",
    alias: ["song", "audio", "music"],
    desc: "Download audio in 3 formats: MP3, Doc, and Voice Note",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botName, botFooter, botPic }) => {
    try {
        if (!q) return reply("🎵 *Popkid, please provide a song name!*");
        
        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        const dateNow = Date.now();

        // Fancy Premium Caption
        const fancyCaption = `
✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐔𝐃𝐈𝐎 𝐄𝐍𝐆𝐈𝐍𝐄* ✨

📝 *𝐓𝐢𝐭𝐥𝐞:* ${video.title}
🕒 *𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧:* ${video.timestamp}
👤 *𝐀𝐫𝐭𝐢𝐬𝐭:* ${video.author.name}
📅 *𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐝:* ${video.ago}

🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐀𝐮𝐝𝐢𝐨 𝐅𝐨𝐫𝐦𝐚𝐭:*
_You can download all three if you like!_
`.trim();

        await sendButtons(conn, from, {
            title: `ᴀᴜᴅɪᴏ ᴍᴜʟᴛɪ-ᴅᴏᴡɴʟᴏᴀᴅᴇʀ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `aud_${video.id}_${dateNow}`, text: "🎵 𝐀𝐮𝐝𝐢𝐨 (𝐌𝐏𝟑)" },
                { id: `doc_${video.id}_${dateNow}`, text: "📁 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭" },
                { id: `ptt_${video.id}_${dateNow}`, text: "🔉 𝐕𝐨𝐢𝐜𝐞 𝐍𝐨𝐭𝐞" }
            ],
        });

        // ==================== MULTI-RESPONSE HANDLER ====================
        const handleAudioResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            // Validate the click
            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                // Fetch direct download link
                const { data } = await axios.get(`${API_BASE}/song?search=${encodeURIComponent(video.url)}`);
                if (!data.status) return;
                
                const downloadUrl = data.data.url;
                const buttonType = selectedButtonId.split("_")[0];

                switch (buttonType) {
                    case "aud": // Standard MP3 Audio
                        await conn.sendMessage(from, { 
                            audio: { url: downloadUrl }, 
                            mimetype: "audio/mpeg",
                            ptt: false
                        }, { quoted: messageData });
                        break;

                    case "doc": // Audio Document
                        await conn.sendMessage(from, { 
                            document: { url: downloadUrl }, 
                            mimetype: "audio/mpeg", 
                            fileName: `${video.title}.mp3`,
                            caption: `*${video.title}*`
                        }, { quoted: messageData });
                        break;

                    case "ptt": // Voice Note (PTT)
                        await conn.sendMessage(from, { 
                            audio: { url: downloadUrl }, 
                            mimetype: "audio/ogg; codecs=opus",
                            ptt: true
                        }, { quoted: messageData });
                        break;
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
                
                // Listener stays ON to allow other button clicks
            } catch (err) {
                console.error("Audio Button Error:", err);
            }
        };

        // Start listening
        conn.ev.on("messages.upsert", handleAudioResponse);

        // Auto-kill listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleAudioResponse);
        }, 300000);

    } catch (e) {
        reply(`❌ Popkid, search failed: ${e.message}`);
    }
});

const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { sendButtons } = require('gifted-btns');

// API Engine
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';

cmd({
    pattern: "play",
    alias: ["song", "audio"],
    desc: "Fancy Multi-Downloader for Popkid-MD",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botName, botFooter, botPic }) => {
    try {
        if (!q) return reply("✨ *Popkid, please provide a song name!*");
        
        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        const dateNow = Date.now();

        // Fancy Caption Styling
        const fancyCaption = `
╔═══════════════════╗
     🎵  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐏𝐋𝐀𝐘𝐄𝐑* 🎵
╚═══════════════════╝

✨ *𝐓𝐢𝐭𝐥𝐞:* ${video.title}
🕒 *𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧:* ${video.timestamp}
👤 *𝐀𝐮𝐭𝐡𝐨𝐫:* ${video.author.name}
👁️ *𝐕𝐢𝐞𝐰𝐬:* ${video.views.toLocaleString()}
📅 *𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐝:* ${video.ago}

🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐲𝐨𝐮𝐫 𝐟𝐨𝐫𝐦𝐚𝐭𝐬 𝐛𝐞𝐥𝐨𝐰:*
_You can click multiple buttons!_
`.trim();

        await sendButtons(conn, from, {
            title: `ᴘᴏᴘᴋɪᴅ ᴍᴜʟᴛɪ-ᴅᴏᴡɴʟᴏᴀᴅᴇʀ`,
            text: fancyCaption,
            footer: botFooter || 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `aud_${video.id}_${dateNow}`, text: "🎵 𝐀𝐮𝐝𝐢𝐨 (𝐌𝐏𝟑)" },
                { id: `vid_${video.id}_${dateNow}`, text: "🎥 𝐕𝐢𝐝𝐞𝐨 (𝐌𝐏𝟒)" },
                { id: `doc_${video.id}_${dateNow}`, text: "📁 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭" }
            ],
        });

        // ==================== MULTI-RESPONSE HANDLER ====================
        const handleMultiResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            // Validate the click is for THIS specific request
            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, { react: { text: "⏳", key: messageData.key } });

            try {
                const buttonType = selectedButtonId.split("_")[0];

                if (buttonType === "aud") {
                    const { data } = await axios.get(`${API_BASE}/song?search=${encodeURIComponent(video.url)}`);
                    await conn.sendMessage(from, { 
                        audio: { url: data.data.url }, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: messageData });
                } 
                
                else if (buttonType === "vid") {
                    const { data } = await axios.get(`${API_BASE}/ytv?url=${encodeURIComponent(video.url)}`);
                    await conn.sendMessage(from, { 
                        video: { url: data.data.url }, 
                        caption: `🎬 *${video.title}*\n_Downloaded by Popkid-MD_` 
                    }, { quoted: messageData });
                }

                else if (buttonType === "doc") {
                    const { data } = await axios.get(`${API_BASE}/song?search=${encodeURIComponent(video.url)}`);
                    await conn.sendMessage(from, { 
                        document: { url: data.data.url }, 
                        mimetype: "audio/mpeg", 
                        fileName: `${video.title}.mp3` 
                    }, { quoted: messageData });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
                
                // NOTE: We do NOT use conn.ev.off here yet 
                // so the user can click another button!
            } catch (err) {
                console.error("Multi-button error:", err);
            }
        };

        // Start listening
        conn.ev.on("messages.upsert", handleMultiResponse);

        // Auto-kill the listener after 5 minutes so it doesn't stay open forever
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleMultiResponse);
        }, 300000);

    } catch (e) {
        reply(`❌ Popkid, I hit an error: ${e.message}`);
    }
});

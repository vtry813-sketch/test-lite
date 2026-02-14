const { cmd } = require('../command');
const config = require('../config'); // This imports your config file

cmd({
    pattern: "setprefix",
    desc: "Update the command prefix",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, m, mek, { from, reply, text, isOwner }) => {

    // 🛡️ Safety: Using the OWNER_NUMBER check from your config
    if (!isOwner) return reply("*❌ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ*");

    if (!text) return reply("*⚠️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴘʀᴇғɪx (ᴇ.ɢ .sᴇᴛᴘʀᴇғɪx !)*");

    try {
        // This updates the prefix in the current running process
        config.PREFIX = text; 
        
        // Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // Styled POPKID MP3 Response 💝
        const caption = `*⚙️ P O P K I D  S E T T I N G S 💝*\n\n` +
                        `*✨ sᴛᴀᴛᴜs:* ᴘʀᴇғɪx ᴜᴘᴅᴀᴛᴇᴅ ʟɪᴠᴇ\n` +
                        `*🎯 ɴᴇᴡ ᴘʀᴇғɪx:* [ ${text} ]\n\n` +
                        `> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ*`;

        await conn.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, // Uses your alive image from config
            caption: caption 
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("*❗ sʏsᴛᴇᴍ ᴇʀʀᴏʀ: ᴜɴᴀʙʟᴇ ᴛᴏ ᴍᴏᴅɪғʏ ᴘʀᴇғɪx*");
    }
});

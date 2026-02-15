const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━//
//                  HELPERS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

const isEnabled = (val) =>
    val && val.toString().toLowerCase() === "true";

const badge = (val) =>
    isEnabled(val) ? "🟢 ON " : "🔴 OFF";

const pad = (text, length = 17) =>
    text.length >= length ? text : text + " ".repeat(length - text.length);

const row = (key, value) =>
    `┃ ${pad(key)} : ${value}\n`;

const section = (title, content) => `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ${title}
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
${content}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━//
//                  COMMAND
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━//

cmd({
    pattern: "config",
    alias: ["settings", "env"],
    desc: "Show all bot configuration variables (Owner Only)",
    category: "system",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply, isCreator }) => {

    try {

        if (!isCreator) {
            return reply("🚫 *Owner Only Command!* You're not authorized to view bot configurations.");
        }

        let caption = `
╔══════════════════════════════╗
║      ⚙️ ${config.BOT_NAME} CONTROL PANEL
╚══════════════════════════════╝
`;

        caption += section("🤖 BOT INFORMATION",
            row("Bot Name", config.BOT_NAME) +
            row("Prefix", config.PREFIX) +
            row("Owner", config.OWNER_NAME) +
            row("Owner No", config.OWNER_NUMBER) +
            row("Mode", config.MODE.toUpperCase())
        );

        caption += section("⚙️ CORE SETTINGS",
            row("Public Mode", badge(config.PUBLIC_MODE)) +
            row("Always Online", badge(config.ALWAYS_ONLINE)) +
            row("Read Messages", badge(config.READ_MESSAGE)) +
            row("Read Commands", badge(config.READ_CMD))
        );

        caption += section("🔌 AUTOMATION",
            row("Auto Reply", badge(config.AUTO_REPLY)) +
            row("Auto React", badge(config.AUTO_REACT)) +
            row("Custom React", badge(config.CUSTOM_REACT)) +
            row("React Emojis", config.CUSTOM_REACT_EMOJIS) +
            row("Auto Sticker", badge(config.AUTO_STICKER))
        );

        caption += section("📢 STATUS SETTINGS",
            row("Status Seen", badge(config.AUTO_STATUS_SEEN)) +
            row("Status Reply", badge(config.AUTO_STATUS_REPLY)) +
            row("Status React", badge(config.AUTO_STATUS_REACT)) +
            row("Status Message", config.AUTO_STATUS_MSG)
        );

        caption += section("🛡️ SECURITY",
            row("Anti-Link", badge(config.ANTI_LINK)) +
            row("Anti-Bad Word", badge(config.ANTI_BAD)) +
            row("Anti-ViewOnce", badge(config.ANTI_VV)) +
            row("Delete Links", badge(config.DELETE_LINKS))
        );

        caption += section("🎨 MEDIA SETTINGS",
            row("Alive Image", config.ALIVE_IMG) +
            row("Menu Image", config.MENU_IMAGE_URL) +
            row("Alive Message", config.LIVE_MSG) +
            row("Sticker Pack", config.STICKER_NAME)
        );

        caption += section("⏳ MISC SETTINGS",
            row("Auto Typing", badge(config.AUTO_TYPING)) +
            row("Auto Recording", badge(config.AUTO_RECORDING)) +
            row("Anti-Delete Path", config.ANTI_DEL_PATH) +
            row("Developer Number", config.DEV)
        );

        caption += `
╔══════════════════════════════╗
║  📌 ${config.DESCRIPTION}
╚══════════════════════════════╝
`;

        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL },
                caption: caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error("Config Command Error:", error);
        reply(`❌ Error displaying config: ${error.message}`);
    }
});

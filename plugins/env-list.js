const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

//━━━━━━━━━━━━━━━━━━━━━━━━━━//
//          HELPERS
//━━━━━━━━━━━━━━━━━━━━━━━━━━//

const isEnabled = (val) =>
    val && val.toString().toLowerCase() === "true";

const badge = (val) =>
    isEnabled(val) ? "🟢 ON" : "🔴 OFF";

const row = (key, value) =>
    `│ ${key.padEnd(14)} : ${value}\n`;

const header = (title) =>
`╭─〔 ${title} 〕─╮\n`;

const footer =
`╰────────────────╯\n`;

//━━━━━━━━━━━━━━━━━━━━━━━━━━//
//          COMMAND
//━━━━━━━━━━━━━━━━━━━━━━━━━━//

cmd({
    pattern: "config",
    alias: ["varlist", "envlist"],
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
╔══════════════════════╗
║ ⚙️ ${config.BOT_NAME} SYSTEM
╚══════════════════════╝
`;

        // BOT INFO
        caption += header("🤖 BOT INFO");
        caption += row("Name", config.BOT_NAME);
        caption += row("Prefix", config.PREFIX);
        caption += row("Owner", config.OWNER_NAME);
        caption += row("Owner No", config.OWNER_NUMBER);
        caption += row("Mode", config.MODE.toUpperCase());
        caption += footer;

        // CORE
        caption += header("⚙️ CORE");
        caption += row("Public", badge(config.PUBLIC_MODE));
        caption += row("Always On", badge(config.ALWAYS_ONLINE));
        caption += row("Read Msgs", badge(config.READ_MESSAGE));
        caption += row("Read Cmds", badge(config.READ_CMD));
        caption += footer;

        // AUTOMATION
        caption += header("🔌 AUTOMATION");
        caption += row("Auto Reply", badge(config.AUTO_REPLY));
        caption += row("Auto React", badge(config.AUTO_REACT));
        caption += row("Custom React", badge(config.CUSTOM_REACT));
        caption += row("React Emojis", config.CUSTOM_REACT_EMOJIS);
        caption += row("Auto Sticker", badge(config.AUTO_STICKER));
        caption += footer;

        // STATUS
        caption += header("📡 STATUS");
        caption += row("Seen", badge(config.AUTO_STATUS_SEEN));
        caption += row("Reply", badge(config.AUTO_STATUS_REPLY));
        caption += row("React", badge(config.AUTO_STATUS_REACT));
        caption += row("Message", config.AUTO_STATUS_MSG);
        caption += footer;

        // SECURITY
        caption += header("🛡 SECURITY");
        caption += row("Anti-Link", badge(config.ANTI_LINK));
        caption += row("Anti-Bad", badge(config.ANTI_BAD));
        caption += row("Anti-VV", badge(config.ANTI_VV));
        caption += row("Del Links", badge(config.DELETE_LINKS));
        caption += footer;

        // MEDIA
        caption += header("🎨 MEDIA");
        caption += row("Alive Img", config.ALIVE_IMG);
        caption += row("Menu Img", config.MENU_IMAGE_URL);
        caption += row("Alive Msg", config.LIVE_MSG);
        caption += row("Sticker", config.STICKER_NAME);
        caption += footer;

        // MISC
        caption += header("⏳ MISC");
        caption += row("Typing", badge(config.AUTO_TYPING));
        caption += row("Recording", badge(config.AUTO_RECORDING));
        caption += row("Anti-Del", config.ANTI_DEL_PATH);
        caption += row("Dev No", config.DEV);
        caption += footer;

        caption += `
╭─〔 📌 DESCRIPTION 〕─╮
│ ${config.DESCRIPTION}
╰────────────────╯
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

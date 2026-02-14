//---------------------------------------------------------------------------
//           popkid-md
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------------------------------------
const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const path = require('path');

// Helper to update config and prefix globally
const updatePrefix = (newPrefix) => {
    config.PREFIX = newPrefix;
    // Note: In some frameworks, you may need to update process.env.PREFIX as well
    process.env.PREFIX = newPrefix; 
};

//--------------------------------------------
// SET PREFIX
//--------------------------------------------
cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    react: "🔧",
    desc: "Change the bot's command prefix.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const newPrefix = args[0];
    if (!newPrefix) return reply("❌ Please provide a new prefix. Example: `.setprefix !`");

    updatePrefix(newPrefix);
    return reply(`✅ Prefix successfully changed to *${newPrefix}*\n\n*Note:* If it doesn't react to the new prefix immediately, the bot may need a manual restart depending on your host.`);
});

//--------------------------------------------
// BOT MODE (PUBLIC/PRIVATE)
//--------------------------------------------
cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🫟",
    desc: "Set bot mode to private or public.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const modeArg = args[0]?.toLowerCase();
    if (modeArg === "private") {
        config.MODE = "private";
        return reply("✅ Bot mode is now set to *PRIVATE*.");
    } else if (modeArg === "public") {
        config.MODE = "public";
        return reply("✅ Bot mode is now set to *PUBLIC*.");
    } else {
        return reply(`📌 Current mode: *${config.MODE}*\n\nUsage: .mode private OR .mode public`);
    }
});

//--------------------------------------------
// NOTIFICATIONS & EVENTS
//--------------------------------------------
cmd({
    pattern: "admin-events",
    alias: ["adminevents"],
    desc: "Enable or disable admin event notifications",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") { config.ADMIN_EVENTS = "true"; return reply("✅ Enabled."); }
    if (status === "off") { config.ADMIN_EVENTS = "false"; return reply("❌ Disabled."); }
    reply("Example: .admin-events on");
});

cmd({
    pattern: "welcome",
    alias: ["welcomeset"],
    desc: "Enable or disable welcome messages",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") { config.WELCOME = "true"; return reply("✅ Welcome enabled."); }
    if (status === "off") { config.WELCOME = "false"; return reply("❌ Welcome disabled."); }
    reply("Example: .welcome on");
});

//--------------------------------------------
// AUTOMATION SETTINGS
//--------------------------------------------
cmd({
    pattern: "auto-typing",
    description: "Enable or disable auto-typing.",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) return reply("Example: .auto-typing on");
    config.AUTO_TYPING = status === "on" ? "true" : "false";
    return reply(`Auto typing is now ${status}.`);
});

cmd({
    pattern: "mention-reply",
    alias: ["mee"],
    description: "Enable or disable mention reply.",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.MENTION_REPLY = "true"; return reply("Mention Reply enabled."); }
    if (args[0] === "off") { config.MENTION_REPLY = "false"; return reply("Mention Reply disabled."); }
    reply("Example: .mee on");
});

cmd({
    pattern: "always-online",
    alias: ["alwaysonline"],
    desc: "Enable/Disable always online mode",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.ALWAYS_ONLINE = "true"; return reply("✅ Always Online enabled."); }
    if (args[0] === "off") { config.ALWAYS_ONLINE = "false"; return reply("❌ Always Online disabled."); }
    reply("Example: .always-online on");
});

cmd({
    pattern: "auto-recording",
    alias: ["autorecoding"],
    description: "Enable/Disable auto-recording.",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_RECORDING = "true";
        await conn.sendPresenceUpdate("recording", from);
        return reply("Auto recording enabled.");
    } else if (status === "off") {
        config.AUTO_RECORDING = "false";
        await conn.sendPresenceUpdate("available", from);
        return reply("Auto recording disabled.");
    }
    reply("Example: .auto-recording on");
});

//--------------------------------------------
// STATUS SETTINGS
//--------------------------------------------
cmd({
    pattern: "auto-seen",
    alias: ["autostatusview"],
    desc: "Auto-viewing of statuses",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.AUTO_STATUS_SEEN = "true"; return reply("Auto-view enabled."); }
    if (args[0] === "off") { config.AUTO_STATUS_SEEN = "false"; return reply("Auto-view disabled."); }
    reply("Example: .auto-seen on");
});

cmd({
    pattern: "status-react",
    alias: ["statusreaction"],
    desc: "Auto-liking of statuses",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.AUTO_STATUS_REACT = "true"; return reply("Status react enabled."); }
    if (args[0] === "off") { config.AUTO_STATUS_REACT = "false"; return reply("Status react disabled."); }
    reply("Example: .status-react on");
});

//--------------------------------------------
// SECURITY & FILTERS
//--------------------------------------------
cmd({
    pattern: "read-message",
    alias: ["autoread"],
    desc: "Auto-read messages",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.READ_MESSAGE = "true"; return reply("Read message enabled."); }
    if (args[0] === "off") { config.READ_MESSAGE = "false"; return reply("Read message disabled."); }
    reply("Example: .read-message on");
});

cmd({
    pattern: "anti-bad",
    alias: ["antibadword"],
    desc: "Enable/Disable antibad words",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.ANTI_BAD_WORD = "true"; return reply("Anti-bad enabled."); }
    if (args[0] === "off") { config.ANTI_BAD_WORD = "false"; return reply("Anti-bad disabled."); }
    reply("Example: .anti-bad on");
});

cmd({
    pattern: "antilink",
    alias: ["antilinks"],
    desc: "Enable or disable ANTI_LINK in groups",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    if (!isGroup) return reply('This command can only be used in a group.');
    if (!isBotAdmins) return reply('Bot must be an admin.');
    if (!isAdmins) return reply('You must be an admin.');

    if (args[0] === "on") { config.ANTI_LINK = "true"; return reply("✅ ANTI_LINK enabled."); }
    if (args[0] === "off") { config.ANTI_LINK = "false"; return reply("❌ ANTI_LINK disabled."); }
    reply("Usage: .antilink on/off");
});

//--------------------------------------------
// MISC AUTOMATION
//--------------------------------------------
cmd({
    pattern: "auto-sticker",
    alias: ["autosticker"],
    desc: "Auto-convert images to stickers",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.AUTO_STICKER = "true"; return reply("Auto-sticker enabled."); }
    if (args[0] === "off") { config.AUTO_STICKER = "false"; return reply("Auto-sticker disabled."); }
    reply("Example: .auto-sticker on");
});

cmd({
    pattern: "auto-reply",
    alias: ["autoreply"],
    desc: "Auto-reply to messages",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") { config.AUTO_REPLY = "true"; return reply("Auto-reply enabled."); }
    if (args[0] === "off") { config.AUTO_REPLY = "false"; return reply("Auto-reply disabled."); }
    reply("Example: .auto-reply on");
});

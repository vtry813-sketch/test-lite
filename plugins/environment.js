//---------------------------------------------------------------------------
//           popkid-md (FIXED PERMANENT SETTINGS)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// ==================================================
// UPDATE CONFIG FUNCTION (PERMANENT SAVE)
// ==================================================
function updateConfig(key, value) {
    const configPath = path.join(__dirname, '../config.js');
    let data = fs.readFileSync(configPath, 'utf8');

    const regex = new RegExp(`${key}:\\s*['"\`].*?['"\`]`);
    data = data.replace(regex, `${key}: '${value}'`);

    fs.writeFileSync(configPath, data);
}

// ==================================================
// SET PREFIX (AUTO RESTART)
// ==================================================
cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    react: "🔧",
    desc: "Change bot prefix",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) return reply("*📛 Only owner can use this command!*");

    const newPrefix = args[0];
    if (!newPrefix) return reply("Example: .setprefix !");

    updateConfig("PREFIX", newPrefix);

    reply(`✅ Prefix changed to *${newPrefix}*\n♻️ Restarting bot...`);
    process.exit();
});

// ==================================================
// GENERIC OWNER TOGGLE COMMAND
// ==================================================
function ownerToggle(pattern, configKey) {
    cmd({
        pattern,
        category: "settings",
        filename: __filename
    }, async (conn, mek, m, { args, isCreator, reply }) => {

        if (!isCreator) return reply("*📛 Only owner can use this command!*");

        const status = args[0]?.toLowerCase();
        if (!["on", "off"].includes(status)) {
            return reply(`Example: .${pattern} on`);
        }

        updateConfig(configKey, status === "on" ? "true" : "false");

        reply(`✅ ${pattern} ${status === "on" ? "enabled" : "disabled"} successfully.`);
    });
}

// ==================================================
// OWNER SETTINGS
// ==================================================
ownerToggle("admin-events", "ADMIN_EVENTS");
ownerToggle("welcome", "WELCOME");
ownerToggle("auto-typing", "AUTO_TYPING");
ownerToggle("mention-reply", "MENTION_REPLY");
ownerToggle("always-online", "ALWAYS_ONLINE");
ownerToggle("auto-recording", "AUTO_RECORDING");
ownerToggle("auto-seen", "AUTO_STATUS_SEEN");
ownerToggle("status-react", "AUTO_STATUS_REACT");
ownerToggle("read-message", "READ_MESSAGE");
ownerToggle("anti-bad", "ANTI_BAD_WORD");
ownerToggle("auto-sticker", "AUTO_STICKER");
ownerToggle("auto-reply", "AUTO_REPLY");
ownerToggle("auto-react1", "AUTO_REACT");
ownerToggle("status-reply", "AUTO_STATUS_REPLY");

// ==================================================
// MODE COMMAND
// ==================================================
cmd({
    pattern: "mode",
    alias: ["setmode"],
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) return reply("*📛 Only owner can use this command!*");

    const mode = args[0]?.toLowerCase();

    if (!["private", "public"].includes(mode)) {
        return reply("Example: .mode private OR .mode public");
    }

    updateConfig("MODE", mode);
    reply(`✅ Bot mode changed to *${mode.toUpperCase()}*`);
});

// ==================================================
// GROUP TOGGLE COMMAND
// ==================================================
function groupToggle(pattern, configKey) {
    cmd({
        pattern,
        category: "group",
        filename: __filename
    }, async (conn, mek, m, { args, isGroup, isAdmins, isBotAdmins, reply }) => {

        if (!isGroup) return reply("❌ This command is for groups only.");
        if (!isAdmins) return reply("❌ Only group admins can use this.");
        if (!isBotAdmins) return reply("❌ Bot must be admin.");

        const status = args[0]?.toLowerCase();

        if (!["on", "off"].includes(status)) {
            return reply(`Usage: .${pattern} on/off`);
        }

        updateConfig(configKey, status === "on" ? "true" : "false");

        reply(`✅ ${pattern} ${status === "on" ? "enabled" : "disabled"} successfully.`);
    });
}

// ==================================================
// GROUP SETTINGS
// ==================================================
groupToggle("antilink", "ANTI_LINK");
groupToggle("antilinkkick", "ANTI_LINK_KICK");
groupToggle("deletelink", "DELETE_LINKS");

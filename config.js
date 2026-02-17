const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // ====== Connexion MongoDB (ajouté) ======
    MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://manaheva05_db_user:pFOdnnWYWLaDqH9I@inconnuboy.afh6ipt.mongodb.net/?appName=Inconnuboy",

    // ====== Session (optionnel, plus utilisé si téléchargement Mega supprimé) ======
    // SESSION_ID: process.env.SESSION_ID || "POPKID;;;HcURgQQT#el1w53_DkYDDW13cEvqw0q80vHfOfnyZO_cyAL0mAUU",

    // ====== Paramètres de base ======
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃",
    STICKER_NAME: process.env.STICKER_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
    OWNER_NAME: process.env.OWNER_NAME || "𝐏𝐎𝐏𝐊𝐈𝐃",
    MODE: process.env.MODE || "public",          // public/private/inbox/groups
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    AUTO_TYPING: process.env.AUTO_TYPING || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    READ_CMD: process.env.READ_CMD || "false",
    AUTO_BIO: process.env.AUTO_BIO || "true",
    TIME_ZONE: process.env.TIME_ZONE || "Asia/Kolkata",

    // ====== Statuts et réactions ======
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    CUSTOM_STATUS_EMOJIS: process.env.CUSTOM_STATUS_EMOJIS || "❤️,✨,🔥,💯,👑",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃 𝐕𝐈𝐄𝐖𝐄𝐃✅*",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",

    // ====== Anti-Call ======
    ANTI_CALL: process.env.ANTI_CALL || "false",

    // ====== Anti-Delete ======
    ANTI_DELETE: process.env.ANTI_DELETE || "false",
    ANTI_DELETE_DM: process.env.ANTI_DELETE_DM || "false",
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log",

    // ====== Anti-Link ======
    ANTI_LINK: process.env.ANTI_LINK || "false",
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
    LINK_WHITELIST: "youtube.com,github.com",
    LINK_ACTION: "mute",
    LINK_WARN_LIMIT: 3,
    ANTI_LINK_MODE: process.env.ANTI_LINK_MODE || "warn",
    ANTI_LINK_WARN_MSG: process.env.ANTI_LINK_WARN_MSG || "⚠️ Links are not allowed in this group.",
    ANTI_LINK_KICK_MSG: process.env.ANTI_LINK_KICK_MSG || "🚪 You have been removed for sending links.",
    ANTI_LINK_DELETE_MSG: process.env.ANTI_LINK_DELETE_MSG || "🗑️ Link message deleted.",
    DELETE_LINKS: process.env.DELETE_LINKS || "true",

    // ====== Bienvenue et événements ======
    WELCOME: process.env.WELCOME || "false",
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || "true",
    MENTION_REPLY: process.env.MENTION_REPLY || "false",

    // ====== Images et messages ======
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/aapw1p.png",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/aapw1p.png",
    LIVE_MSG: process.env.LIVE_MSG || "> 𝐏𝐎𝐏𝐊𝐈𝐃 𝐌𝐃 𝐁𝐎𝐓😇",
    DESCRIPTION: process.env.DESCRIPTION || "*𝙿𝙾𝙿𝙺𝙸𝙳 𝚇𝙼𝙳 𝙱𝙾𝚃😇*",

    // ====== Autres ======
    ANTI_BAD: process.env.ANTI_BAD || "true",
    ANTI_VV: process.env.ANTI_VV || "true",
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    DEV: process.env.DEV || "254732297194"
};

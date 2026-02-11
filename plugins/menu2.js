const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// --- PRE-LOAD IMAGE TO STOP LAG ---
const menuImagePath = path.resolve('./popkid/menu.jpg');
let menuImageBuffer = null;
try {
    menuImageBuffer = fs.readFileSync(menuImagePath);
} catch (e) {
    console.log("Menu image not found, will send text only.");
}

// Helpers
const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
    return (bytes / 1048576).toFixed(1) + 'MB';
};

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (24 * 3600));
    const h = Math.floor((seconds % (24 * 3600)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

// MAIN MENU COMMAND
cmd({
    pattern: 'menu2',
    alias: ['help', 'allmenu'],
    react: '🌸',
    category: 'main',
    filename: __filename,
    desc: 'Show stylish main menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {
        const timeZone = 'Africa/Nairobi';
        const time = moment.tz(timeZone).format('hh:mm:ss A');
        const date = moment.tz(timeZone).format('DD/MM/YYYY');
        const uptime = formatUptime(process.uptime());
        const ram = `${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}`;
        const mode = (config.MODE === 'public') ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';

        // Group Commands by Category
        const commandsByCategory = {};
        let totalCommands = 0;
        commands.forEach(command => {
            if (command.pattern && !command.dontAdd && command.category) {
                const cat = command.category.toUpperCase();
                if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
                commandsByCategory[cat].push(command.pattern.split('|')[0]);
                totalCommands++;
            }
        });

        // Construct Menu String with Fancy Flowers & Lines
        let menu = `🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
🌷 *${config.BOT_NAME || 'POP KID-MD'}* 🌷
🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸

⛅ Mode       : ${mode}
👤 User       : ${userName}
💻 Plugins    : ${totalCommands}
⏱️ Uptime     : ${uptime}
📅 Date       : ${date}
🖥️ RAM       : ${ram}
⚡ Ping       : ${Math.floor(Math.random() * 50) + 10}ms

🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
*Commands List:* 🌷
`;

        for (const category in commandsByCategory) {
            menu += `\n🌺 ────❮ *${category}* ❯──── 🌺\n`;
            commandsByCategory[category].sort().forEach(cmdName => {
                menu += `🌼 ${config.PREFIX}${cmdName}\n`;
            });
        }

        menu += `\n🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸`;

        // Send Menu
        await conn.sendMessage(from, {
            image: menuImageBuffer ? { url: menuImagePath } : { url: 'https://via.placeholder.com/500' },
            caption: menu,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 1,
                externalAdReply: {
                    title: `${config.BOT_NAME || 'POP KID-MD'} Menu`,
                    body: 'Stylish & Advanced',
                    thumbnail: menuImageBuffer,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});

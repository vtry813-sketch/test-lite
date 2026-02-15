const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { sendButtons } = require('gifted-btns');

const MENU_IMAGE_URL = "https://files.catbox.moe/aapw1p.png";

// =====================
// Helpers
// =====================

const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0MB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + 'GB';
    return (bytes / 1048576).toFixed(2) + 'MB';
};

const formatUptime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getSystemStats = () => {
    const total = os.totalmem();
    const free = os.freemem();
    return {
        ram: `${formatSize(total - free)}/${formatSize(total)}`,
        cpu: os.cpus()[0]?.model || 'Unknown CPU',
        platform: os.platform()
    };
};

// =====================
// MENU COMMAND
// =====================

cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '✅',
    category: 'main',
    filename: __filename,
    desc: 'Show optimized main menu'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {

        const start = Date.now();
        const now = moment().tz('Africa/Nairobi');

        const date = now.format('DD/MM/YYYY');
        const uptime = formatUptime(process.uptime());
        const stats = getSystemStats();
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || 'User';

        const commandsByCategory = {};
        let totalCommands = 0;

        commands
            .filter(cmd => cmd.pattern && !cmd.dontAdd && cmd.category)
            .forEach(cmd => {
                const category = cmd.category.toUpperCase().trim();
                const name = cmd.pattern.split('|')[0].trim();

                if (!commandsByCategory[category])
                    commandsByCategory[category] = new Set();

                commandsByCategory[category].add(name);
                totalCommands++;
            });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        let menu = `╭══〘 *${config.BOT_NAME || 'POP KID-MD'}* 〙══⊷
┃❍ *Mode:* ${mode}
┃❍ *User:* ${userName}
┃❍ *Plugins:* ${totalCommands}
┃❍ *Uptime:* ${uptime}
┃❍ *Date:* ${date}
┃❍ *RAM:* ${stats.ram}
┃❍ *Ping:* calculating...
╰═════════════════⊷

*Command List ⤵*`;

        for (const category of sortedCategories) {

            menu += `\n\n╭━━━━❮ *${category}* ❯━⊷\n`;

            const sortedCommands = [...commandsByCategory[category]].sort();

            for (const cmdName of sortedCommands) {
                menu += `┃✞︎ ${config.PREFIX}${cmdName}\n`;
            }

            menu += `╰━━━━━━━━━━━━━━━━━⊷`;
        }

        menu += `\n\n> *${config.BOT_NAME || 'POP KID-MD'}* © 2026 🇰🇪`;

        const end = Date.now();
        const ping = end - start;
        menu = menu.replace('calculating...', `${ping}ms`);

        // =====================
        // SEND BUTTON MESSAGE (Same content)
        // =====================

        await sendButtons(conn, from, {
            title: `🤖 ${config.BOT_NAME || 'POP KID-MD'} MENU`,
            text: menu,
            footer: "🚀 Powered By Popkid XMD",
            image: MENU_IMAGE_URL,
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🌐 Official Channel",
                        url: "https://whatsapp.com"
                    })
                }
            ]
        });

    } catch (e) {
        console.error(e);
        reply('❌ Menu processing error.');
    }
});

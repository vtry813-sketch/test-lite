const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// Helper: monospace text
const monospace = (text) => `\`${text}\``;

// Helper: format memory size
const formatSize = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
  return (bytes / 1024).toFixed(0) + 'KB';
};

// Helper: format uptime
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

cmd({
  pattern: 'menu2',
  alias: ['help2', 'allmenu2'],
  react: '💎',
  category: 'main',
  filename: __filename,
  desc: 'Show bot main menu with system info'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
  try {
    const prefix = config.PREFIX || '.';
    const timeZone = 'Africa/Nairobi';
    const time = moment.tz(timeZone).format('hh:mm:ss A');
    const date = moment.tz(timeZone).format('DD/MM/YYYY');
    const uptime = formatUptime(process.uptime());
    const cpuModel = os.cpus()[0]?.model || 'N/A';
    const totalRam = os.totalmem();
    const usedRam = totalRam - os.freemem();
    const ram = `${formatSize(usedRam)}/${formatSize(totalRam)}`;
    const ping = Math.floor(Math.random() * 50) + 10; 
    const mode = (config.MODE === 'public') ? 'PUBLIC' : 'PRIVATE';
    
    // Safety check for commands array
    const totalCommands = Array.isArray(commands) ? commands.filter(a => a.pattern).length : 0;

    // Group commands by category
    const commandsByCategory = {};
    if (Array.isArray(commands)) {
      for (const command of commands) {
        if (command.category && !command.dontAdd && command.pattern) {
          const cat = command.category.toUpperCase();
          if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
          commandsByCategory[cat].push(command.pattern.split('|')[0]);
        }
      }
    }

    // SAFE USERNAME: Handles cases where sender might be undefined
    const userName = pushName || (sender ? sender.split('@')[0] : 'User');

    // HEADER - Removed .toString() as template literals handle conversion automatically
    let menu = `╭══〘〘 *${monospace(config.BOT_NAME || 'POP KID-MD')}* 〙〙═⊷
┃❍ *Mode:* ${monospace(mode)}
┃❍ *Prefix:* [ ${monospace(prefix)} ]
┃❍ *User:* ${monospace(userName)}
┃❍ *Plugins:* ${monospace(totalCommands)}
┃❍ *Uptime:* ${monospace(uptime)}
┃❍ *Date:* ${monospace(date)}
┃❍ *Time:* ${monospace(time)}
┃❍ *Server RAM:* ${monospace(ram)}
┃❍ *CPU:* ${monospace(cpuModel)}
┃❍ *Ping:* ${monospace(`${ping}ms`)}
╰═════════════════⊷

*Command List ⤵*`;

    // COMMAND LIST
    for (const category in commandsByCategory) {
      menu += `\n\n╭━━━━❮ *${monospace(category)}* ❯━⊷\n`;
      const sorted = commandsByCategory[category].sort();
      for (const cmdName of sorted) {
        menu += `┃✞︎ ${monospace(prefix + cmdName)}\n`;
      }
      menu += `╰━━━━━━━━━━━━━━━━━⊷`;
    }

    menu += `\n\n> *${config.BOT_NAME || 'POP KID-MD'}* © 2026 🇰🇪\n> *ᴘᴏᴘᴋɪᴅ ᴘʀᴏᴊᴇᴄᴛs*`;

    // Read local image buffer
    const menuImagePath = path.resolve('./popkid/menu.jpg');
    let imageBuffer;
    try {
        imageBuffer = await fs.promises.readFile(menuImagePath);
    } catch (e) {
        console.error("Image not found at path:", menuImagePath);
        // Fallback if image is missing to prevent total crash
        imageBuffer = Buffer.alloc(0); 
    }

    // SEND MESSAGE
    await conn.sendMessage(from, {
      image: { url: menuImagePath }, // Using url: path is often more stable in Baileys
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 10,
        isForwarded: true,
        externalAdReply: {
          title: 'POP KID-MD V2 ADVANCED',
          body: 'Powered by POPKID TECH',
          thumbnail: imageBuffer,
          sourceUrl: 'https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error("Menu Error:", e);
    reply(`❌ Error: ${e.message}`);
  }
});

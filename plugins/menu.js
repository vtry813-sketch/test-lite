const config = require('../config');
const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');

// Quoted Contact Message (Verified Style)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "ᴘᴏᴘᴋɪᴅ VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:ᴘᴏᴘᴋɪᴅ VERIFIED ✅
ORG:POP KID BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

// Small-caps stylizer
function smallCaps(str) {
  const map = {
    a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ',
    i:'ɪ', j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ',
    q:'ǫ', r:'ʀ', s:'s', t:'ᴛ', u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x',
    y:'ʏ', z:'ᴢ'
  };
  return str.toLowerCase().split('').map(c => map[c] || c).join('');
}

// Greeting by time
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "🌅 ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🌅";
  if (h >= 12 && h < 17) return "☀️ ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ ☀️";
  if (h >= 17 && h < 21) return "🌇 ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌇";
  return "🌙 ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
}

// Uptime formatter
function formatUptime() {
  let sec = process.uptime();
  let d = Math.floor(sec / 86400);
  let h = Math.floor((sec % 86400) / 3600);
  let m = Math.floor((sec % 3600) / 60);
  return `${d}ᴅ ${h}ʜ ${m}ᴍ`;
}

// Normalize category
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Icon per category
const iconByCategory = {
  stalker: '🕵️',
  downloader: '📥',
  download: '📥',
  ai: '🤖',
  fun: '🎮',
  group: '👥',
  owner: '👑',
  tools: '🛠️',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  main: '🏠',
  music: '🎵',
  anime: '🍥',
  info: '🧠'
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '⚡',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();

    // Build header (EXACT style)
    const header = `╔═══ 📥 ${smallCaps('popkid xmd v3')} 📥 ═══╗
║ 👤 ${smallCaps('owner')}: POPKID-XMD
║ 🤖 ${smallCaps('bot')}: POPKID-XMD
║ ⚙️ ${smallCaps('mode')}: ${smallCaps(config.MODE || 'public')}
║ ⏳ ${smallCaps('uptime')}: ${formatUptime()}
║ 📟 ${smallCaps('platform')}: ${process.platform}
║ 🚀 ${smallCaps('ram')}: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
╚══════════════════════╝
`;

    let menu = header + "\n" + getGreeting() + "\n";

    // Group commands by category
    const categories = {};
    for (const c of commands) {
      if (c.category && !c.dontAdd && c.pattern) {
        const cat = normalize(c.category);
        categories[cat] = categories[cat] || [];

        const name = c.pattern.split('|')[0];
        if (!categories[cat].includes(name)) {
          categories[cat].push(name);
        }
      }
    }

    // Build body sections (EXACT style)
    for (const cat of Object.keys(categories).sort()) {
      const icon = iconByCategory[cat] || '✨';
      const cmds = categories[cat].sort();

      menu += `
┏━━〔 ${smallCaps(cat)} 〕━┈⊷
`;

      for (const c of cmds) {
        menu += `┃ ${icon} ${prefix}${smallCaps(c)}\n`;
      }

      menu += `┗━━━━━━━━━━━━┈⊷\n`;
    }

    // Send menu
    await conn.sendMessage(
      from,
      {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/yr339d.jpg' },
        caption: menu,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 999,
          isForwarded: true
        }
      },
      { quoted: quotedContact }
    );

    // Optional audio menu
    if (config.MENU_AUDIO_URL) {
      await conn.sendMessage(from, { 
        audio: { url: config.MENU_AUDIO_URL }, 
        mimetype: 'audio/mp4', 
        ptt: true 
      }, { quoted: mek });
    }

  } catch (e) {
    console.error('Menu Error:', e);
    await reply(`❌ Error loading menu: ${e.message}`);
  }
});
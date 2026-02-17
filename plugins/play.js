const config = require('../config');
const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'play',
  desc: 'Search & play YouTube audio',
  category: 'downloader',
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) {
      return reply('❌ *Provide a song name*\n\nExample:\n.play Kau masih kekasihku');
    }

    const query = args.join(' ');
    // Updated API to Jawad-Tech
    const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(query)}`;

    await conn.sendMessage(from, {
      react: { text: '🎧', key: mek.key }
    });

    const { data } = await axios.get(api);

    if (!data.status || !data.result) {
      return reply('❌ *Failed to find the song*');
    }

    const res = data.result;

    const caption = `
╭═══〘 *YOUTUBE PLAY* 〙═══⊷
┃❍ *Title:* ${res.title}
┃❍ *Quality:* 128kbps
┃❍ *Size:* Unknown
┃❍ *Format:* mp3
╰═════════════════════════⊷

> *${config.BOT_NAME || 'POP KID-MD'}*
> Powered by JawadTech API
    `.trim();

    await conn.sendMessage(from, {
      audio: { url: res.mp3 }, // Changed from res.dlink to res.mp3
      mimetype: 'audio/mpeg',
      fileName: `${res.title}.mp3`,
      caption,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        externalAdReply: {
          title: res.title,
          body: 'YouTube Audio Player',
          thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', // Generic YT icon as API doesn't provide thumb
          sourceUrl: query,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, {
      react: { text: '✅', key: mek.key }
    });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});

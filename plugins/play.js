const config = require('../config');
const axios = require('axios');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
  pattern: 'play',
  desc: 'Search & play YouTube audio',
  category: 'downloader',
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    const query = args.join(' ');
    if (!query) return reply('❌ *What song do you want to play, Popkid?*');

    await conn.sendMessage(from, { react: { text: '🎧', key: mek.key } });

    // 1. Fetching results with error check
    const search = await yts(query);
    const video = search.videos[0];
    
    if (!video || !video.url) {
      return reply('❌ *Search failed. YouTube might be blocking the request. Try again in a moment.*');
    }

    // 2. Preparing your EliteProTech API request
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(video.url)}&format=mp3`;
    
    // 3. Fetching download link with Timeout to prevent hanging
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const resData = response.data;

    if (!resData || !resData.success || !resData.downloadURL) {
      return reply('❌ *The API couldn\'t generate a link for this song.*');
    }

    // 4. Send the message (Standard Popkid-MD Style)
    await conn.sendMessage(from, {
      audio: { url: resData.downloadURL },
      mimetype: 'audio/mpeg',
      fileName: `${resData.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: resData.title || video.title,
          body: 'POPKID-MD MUSIC',
          thumbnailUrl: video.thumbnail,
          sourceUrl: video.url,
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (e) {
    console.error("PLAY ERROR:", e.message);
    reply(`❌ *System Error:* ${e.message}`);
    await conn.sendMessage(from, { react: { text: '⚠️', key: mek.key } });
  }
});

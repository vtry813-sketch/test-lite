const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'play',
  desc: 'Play song (Alya API only)',
  category: 'downloader',
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {

  try {
    if (!args.length) {
      return reply('Provide a song name.\nExample: .play cardigan');
    }

    const query = args.join(' ');

    // 🔎 1. Search using Alya API
    const searchUrl = `https://rest.alyabotpe.xyz/search/yt?query=${encodeURIComponent(query)}&key=stellar-PSnzL1zZ`;
    const searchRes = await axios.get(searchUrl);

    if (!searchRes.data.status || !searchRes.data.data.length) {
      return reply('Song not found.');
    }

    // Get first result
    const video = searchRes.data.data[0];
    const videoUrl = video.url;

    // 🎵 2. Download using Alya API
    const downloadUrl = `https://rest.alyabotpe.xyz/dl/ytmp3?url=${encodeURIComponent(videoUrl)}&key=stellar-PSnzL1zZ`;
    const { data } = await axios.get(downloadUrl);

    if (!data.status) {
      return reply('Failed to download song.');
    }

    // 🎧 3. Send audio only
    await conn.sendMessage(from, {
      audio: { url: data.data.dl },
      mimetype: 'audio/mpeg',
      fileName: `${data.data.title}.mp3`
    }, { quoted: mek });

  } catch (err) {
    console.error(err);
    reply('Error occurred.');
  }
});

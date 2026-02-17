const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

// API Base
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';

cmd({
    pattern: "play",
    desc: "Premium Audio Downloader",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🎵 *Please provide a song name!*\n*Example:* .play Burna Boy City Boys");

        // 1. React & Search
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ Song not found.");

        const videoUrl = video.url;
        const title = video.title;

        // 2. Fetch Download Link from Aswin API
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const apiUrl = `${API_BASE}/song?search=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status) {
            return reply("❌ API Error: Could not fetch download link.");
        }

        const downloadURL = response.data.data.url;

        // 3. Send the Audio with Premium Ad-Reply
        await conn.sendMessage(from, {
            audio: { url: downloadURL },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "POPKID-MD MUSIC HUB",
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // 4. Final Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ System Error: ${e.message}`);
    }
});

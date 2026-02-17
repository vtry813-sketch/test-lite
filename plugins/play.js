const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { buttons } = require('gifted-btns');

// API Configuration
const API_BASE = 'https://api-aswin-sparky.koyeb.app/api/downloader';
const API_ENDPOINTS = {
    song: (url) => `${API_BASE}/song?search=${encodeURIComponent(url)}`,
    ytv: (url) => `${API_BASE}/ytv?url=${encodeURIComponent(url)}`,
    spotify: (url) => `${API_BASE}/spotify?url=${encodeURIComponent(url)}`,
    tiktok: (url) => `${API_BASE}/tiktok?url=${encodeURIComponent(url)}`,
};

// Temp directory setup
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Helper: Clean Filename
const cleanName = (name) => name.replace(/[^\w\s.-]/gi, '').substring(0, 50);

// ==================== 1. PLAY (Search + Buttons) ====================
cmd({
    pattern: "play",
    alias: ["song", "audio"],
    desc: "Search and download audio with buttons",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🎵 *What song are we playing, Popkid?*");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        const btnList = [
            { buttonId: `.ytmp3 ${video.url}`, buttonText: { displayText: '🎵 AUDIO' }, type: 1 },
            { buttonId: `.ytmp4 ${video.url}`, buttonText: { displayText: '🎥 VIDEO' }, type: 1 },
            { buttonId: `.mp3doc ${video.url}`, buttonText: { displayText: '📁 DOCUMENT' }, type: 1 }
        ];

        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: `*POPKID-MD PLAYER*\n\n*Title:* ${video.title}\n*Duration:* ${video.timestamp}\n*Author:* ${video.author.name}`,
            footer: 'Created by Popkid Kenya',
            buttons: btnList,
            headerType: 4
        }, { quoted: mek });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ==================== 2. YTMP3 (Audio Message) ====================
cmd({
    pattern: "ytmp3",
    desc: "Download YouTube as Audio",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return;
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const { data } = await axios.get(API_ENDPOINTS.song(q));
        if (!data.status) throw new Error("API Offline");

        await conn.sendMessage(from, {
            audio: { url: data.data.url },
            mimetype: 'audio/mpeg',
            fileName: `${data.data.title}.mp3`
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) { reply(`❌ Audio Error: ${e.message}`); }
});

// ==================== 3. YTMP4 (Video) ====================
cmd({
    pattern: "ytmp4",
    alias: ["ytv"],
    desc: "Download YouTube as Video",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return;
        await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });
        const { data } = await axios.get(API_ENDPOINTS.ytv(q));
        
        await conn.sendMessage(from, {
            video: { url: data.data.url },
            caption: `*${data.data.title}*\nDownloaded by POPKID-MD`,
            mimetype: 'video/mp4'
        }, { quoted: mek });
    } catch (e) { reply(`❌ Video Error: ${e.message}`); }
});

// ==================== 4. MP3DOC (Document Mode) ====================
cmd({
    pattern: "mp3doc",
    desc: "Download MP3 as Document",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const { data } = await axios.get(API_ENDPOINTS.song(q));
        await conn.sendMessage(from, {
            document: { url: data.data.url },
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(data.data.title)}.mp3`,
            caption: `🎵 *Title:* ${data.data.title}\n*POPKID-MD DOCS*`
        }, { quoted: mek });
    } catch (e) { reply("❌ Document error."); }
});

// ==================== 5. YTS (Stylish Search) ====================
cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    desc: "Search YouTube Stylishly",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("🔍 What are we searching for?");
    const search = await yts(q);
    let txt = `📺 *POPKID-MD SEARCH*\n\n`;
    search.videos.slice(0, 10).forEach((v, i) => {
        txt += `*${i+1}.* ${v.title}\n🔗 ${v.url}\n\n`;
    });
    reply(txt);
});

// ==================== 6. SPOTIFY ====================
cmd({
    pattern: "spotify",
    desc: "Download Spotify music",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🔗 Provide Spotify Link");
        const { data } = await axios.get(API_ENDPOINTS.spotify(q));
        await conn.sendMessage(from, {
            audio: { url: data.data.download },
            mimetype: 'audio/mpeg',
            fileName: `${data.data.title}.mp3`
        }, { quoted: mek });
    } catch (e) { reply("❌ Spotify Link Error"); }
});

// ==================== 7. TIKTOK ====================
cmd({
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok videos",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🔗 Provide TikTok Link");
        const { data } = await axios.get(API_ENDPOINTS.tiktok(q));
        await conn.sendMessage(from, {
            video: { url: data.data.video },
            caption: `📱 *TikTok:* ${data.data.title}`
        }, { quoted: mek });
    } catch (e) { reply("❌ TikTok Error"); }
});

// ==================== 8. CLEANUP ====================
cmd({
    pattern: "cleanup",
    desc: "Clean temp files",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const files = fs.readdirSync(TEMP_DIR);
    files.forEach(file => fs.unlinkSync(path.join(TEMP_DIR, file)));
    reply(`🧹 Freed up space. Deleted ${files.length} files.`);
});

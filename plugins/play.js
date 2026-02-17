const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { sendButtons } = require('gifted-btns'); // Ensure this is installed

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

// ==================== 1. PLAY (Search + Gifted Buttons) ====================
cmd({
    pattern: "play",
    alias: ["song", "audio"],
    desc: "Search and download audio with gifted buttons",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botName, botFooter, botPic }) => {
    try {
        if (!q) return reply("🎵 *What song are we playing, Popkid?*");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ No results found.");

        const dateNow = Date.now();

        // Send Buttons using Gifted Style
        await sendButtons(conn, from, {
            title: `𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐒𝐎𝐍𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑`,
            text: `⿻ *Title:* ${video.title}\n⿻ *Duration:* ${video.timestamp}\n⿻ *Author:* ${video.author.name}\n\n*Select download format:*`,
            footer: botFooter || 'Created by Popkid Kenya',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `aud_${video.id}_${dateNow}`, text: "Audio 🎶" },
                { id: `doc_${video.id}_${dateNow}`, text: "Document 📄" },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Watch on Youtube",
                        url: video.url,
                    }),
                },
            ],
        });

        // Response Handler for Buttons
        const handleResponse = async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
            if (messageData.key?.remoteJid !== from) return;

            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                const { data } = await axios.get(API_ENDPOINTS.song(video.url));
                if (!data.status) return;

                const buttonType = selectedButtonId.split("_")[0];

                if (buttonType === "aud") {
                    await conn.sendMessage(from, { audio: { url: data.data.url }, mimetype: "audio/mpeg" }, { quoted: messageData });
                } else {
                    await conn.sendMessage(from, { document: { url: data.data.url }, mimetype: "audio/mpeg", fileName: `${cleanName(video.title)}.mp3` }, { quoted: messageData });
                }
                
                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
                conn.ev.off("messages.upsert", handleResponse);
            } catch (err) { 
                conn.ev.off("messages.upsert", handleResponse); 
            }
        };

        conn.ev.on("messages.upsert", handleResponse);
        setTimeout(() => conn.ev.off("messages.upsert", handleResponse), 120000);

    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ==================== 2. VIDEO (Gifted Style) ====================
cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4"],
    desc: "Search and download video with gifted buttons",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botName, botFooter, botPic }) => {
    try {
        if (!q) return reply("🎥 *Which video, Popkid?*");
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ Video not found.");

        const dateNow = Date.now();

        await sendButtons(conn, from, {
            title: `𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑`,
            text: `⿻ *Title:* ${video.title}\n⿻ *Duration:* ${video.timestamp}\n\n*Select format:*`,
            footer: botFooter || 'POPKID-MD',
            image: video.thumbnail || botPic,
            buttons: [
                { id: `vid_${video.id}_${dateNow}`, text: "Video 🎥" },
                { id: `vdoc_${video.id}_${dateNow}`, text: "Video Document 📄" }
            ],
        });

        const handleVideoResponse = async (event) => {
            const messageData = event.messages[0];
            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;

            await conn.sendMessage(from, { react: { text: "🎥", key: messageData.key } });
            const { data } = await axios.get(API_ENDPOINTS.ytv(video.url));
            const buttonType = selectedButtonId.split("_")[0];

            if (buttonType === "vid") {
                await conn.sendMessage(from, { video: { url: data.data.url }, caption: video.title }, { quoted: messageData });
            } else {
                await conn.sendMessage(from, { document: { url: data.data.url }, mimetype: "video/mp4", fileName: `${cleanName(video.title)}.mp4` }, { quoted: messageData });
            }
            conn.ev.off("messages.upsert", handleVideoResponse);
        };

        conn.ev.on("messages.upsert", handleVideoResponse);
        setTimeout(() => conn.ev.off("messages.upsert", handleVideoResponse), 120000);
    } catch (e) { reply(`❌ Video Error: ${e.message}`); }
});

// ==================== 3. YT Search (Stylish) ====================
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

// ==================== 4. Spotify & TikTok ====================
cmd({
    pattern: "spotify",
    desc: "Download Spotify music",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🔗 Provide Spotify Link");
        const { data } = await axios.get(API_ENDPOINTS.spotify(q));
        await conn.sendMessage(from, { audio: { url: data.data.download }, mimetype: 'audio/mpeg', fileName: `${data.data.title}.mp3` }, { quoted: mek });
    } catch (e) { reply("❌ Spotify Error"); }
});

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
        await conn.sendMessage(from, { video: { url: data.data.video }, caption: `📱 *TikTok:* ${data.data.title}` }, { quoted: mek });
    } catch (e) { reply("❌ TikTok Error"); }
});

// ==================== 5. Utility ====================
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

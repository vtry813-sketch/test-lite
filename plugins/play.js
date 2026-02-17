const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "song",
    desc: "Download audio from YouTube by name or link",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a song name or link, Popkid!\n\nExample:\n.song cardigan");
        }

        const query = args.join(" ");  
        const start = Date.now();  

        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });  

        let videoUrl = query;  

        // 1. Search Logic (Yupra API)
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {  
            const searchUrl = `https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`;  
            const searchRes = await axios.get(searchUrl);  

            if (!searchRes.data.status || !searchRes.data.results || searchRes.data.results.length === 0) {  
                return reply("❌ No results found.");  
            }  

            videoUrl = searchRes.data.results[0].url;  
        }  

        // 2. Download Logic (Jawad-Tech API as requested)
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`;  
        const { data } = await axios.get(apiUrl);  

        if (!data.status || !data.result || !data.result.mp3) {  
            return reply("❌ API failed to generate an audio link. Try again later.");  
        }  

        const title = data.result.title || "Popkid-Audio";  
        const audioDownloadUrl = data.result.mp3; 

        const end = Date.now();  
        const speed = end - start;  

        // 3. Inform User
        await reply(  
            `🎧 *Popkid Audio Downloader*\n\n` +  
            `📌 *Title:* ${title}\n` +  
            `⚡ *Speed:* ${speed} ms\n\n` +  
            `⬇️ Sending audio file...`  
        );  

        // 4. Send Audio (Optimized for WhatsApp compatibility)
        await conn.sendMessage(from, {  
            audio: { url: audioDownloadUrl },  
            mimetype: "audio/mpeg",  
            fileName: `${title}.mp3`, // Adding extension helps prevent the "audio not available" error
            ptt: false // Set to true if you want it sent as a voice note
        }, { quoted: mek });  

    } catch (err) {  
        console.error(err);  
        reply("❌ Error: " + err.message);  
    }
});

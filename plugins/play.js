const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "play",
    desc: "Download music from Spotify by link or name",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Give me a song name or Spotify link!\n\nExample:\n.play 2pac intro\n.play https://open.spotify.com/track/xxxx");
        }

        const query = args.join(" ");
        const start = Date.now();

        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        let spotifyUrl = query;

        // If it's NOT a Spotify link, search first
        if (!query.includes("open.spotify.com")) {
            const searchUrl = `https://api.yupra.my.id/api/search/spotify?q=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);

            if (!searchRes.data.status || !searchRes.data.result || searchRes.data.result.length === 0) {
                return reply("❌ No results found for that song.");
            }

            // Take first result
            spotifyUrl = searchRes.data.result[0].url;
        }

        // Now download using the Spotify downloader API
        const apiUrl = `https://api.yupra.my.id/api/downloader/spotify?url=${encodeURIComponent(spotifyUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result || !data.result.download || !data.result.download.url) {
            return reply("❌ Failed to get the song. Try another query.");
        }

        const song = data.result;
        const audioUrl = song.download.url;

        const end = Date.now();
        const speed = end - start;

        await reply(
            `🎵 *Spotify Downloader*\n\n` +
            `📌 *Title:* ${song.title}\n` +
            `👤 *Artist:* ${song.artist}\n` +
            `⚡ *Speed:* ${speed} ms\n\n` +
            `⬇️ Sending audio...`
        );

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            ptt: false
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply("❌ Error while processing your request.");
    }
});
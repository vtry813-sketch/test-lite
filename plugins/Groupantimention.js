const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

// This is where the status of each group is saved
const dataPath = path.join(__dirname, '../popkid_antimention.json');

// Helper functions to handle the "Database" logic accurately
const readData = () => {
    try {
        if (!fs.existsSync(dataPath)) return {};
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
        return {};
    }
};

const writeData = (data) => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// --- TOGGLE COMMAND ---
cmd({
    pattern: "antimention",
    alias: ["antitag", "antimass"],
    desc: "Toggle Anti-Mass Mention protection.",
    category: "group",
    react: "🛡️",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isAdmins, reply }) => {
    if (!isGroup) return reply("❌ This command is for groups only.");
    if (!isAdmins) return reply("❌ Admin permissions required.");

    const data = readData();
    const mode = q ? q.toLowerCase() : "";

    if (mode === "on") {
        data[from] = true;
        writeData(data);
        return reply("✅ *Anti-Mention Enabled*\nI will now delete mass tags from non-admins.");
    } else if (mode === "off") {
        data[from] = false;
        writeData(data);
        return reply("✅ *Anti-Mention Disabled*\nMass tagging is now allowed.");
    } else {
        return reply("📍 *Usage:* .antimention on | off");
    }
});

// --- ACCURATE LISTENER ---
cmd({
    on: "body"
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, botNumber }) => {
    try {
        // 1. Basic Validations
        if (!isGroup || isAdmins || !isBotAdmins || sender === botNumber) return;

        // 2. Check if feature is ON for this specific group
        const data = readData();
        if (!data[from]) return;

        // 3. Extract Mentions accurately from all message types
        const msg = m.message;
        const mentions = msg?.extendedTextMessage?.contextInfo?.mentionedJid || 
                         msg?.imageMessage?.contextInfo?.mentionedJid || 
                         msg?.videoMessage?.contextInfo?.mentionedJid || 
                         msg?.documentWithCaptionMessage?.message?.documentMessage?.contextInfo?.mentionedJid || [];

        // 4. Threshold Check (More than 5 tags = Mass Tag)
        if (mentions.length > 5) {
            // Delete the message
            await conn.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: mek.key.id,
                    participant: sender
                }
            });

            // Warn the user simply and modernly
            return conn.sendMessage(from, { 
                text: `⚠️ *@${sender.split('@')[0]}*, mass tagging is restricted to admins only.`, 
                mentions: [sender] 
            });
        }
    } catch (e) {
        // Silent catch to prevent console lag
    }
});

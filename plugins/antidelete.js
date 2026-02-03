const { cmd } = require('../command');
const { setAnti, getAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ["ad"],
    desc: "Toggle anti-delete and recovery destination",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { reply, q, isCreator }) => {

    if (!isCreator) return reply("🚫 *Owner only.*");

    const action = q?.toLowerCase().trim();

    // MASTER ON
    if (action === "on") {
        await setAnti("gc", true);
        await setAnti("dm", true);
        return reply("🦐 *ANTI DELETE*\n━━━━━━━━━━━\n🟢 Status: *ON*\n♻️ Recovery is now active.");
    }

    // MASTER OFF (Strictly stops all recovery)
    if (action === "off") {
        await setAnti("gc", false);
        await setAnti("dm", false);
        return reply("🦐 *ANTI DELETE*\n━━━━━━━━━━━\n🔴 Status: *OFF*\n🗑️ No messages will be recovered.");
    }

    // PATH SETTINGS
    if (action === "owner") {
        await setAnti("path", "owner");
        return reply("📥 *PATH UPDATED*\nRecovered messages will be sent to your **Private DM**.");
    }

    if (action === "chat") {
        await setAnti("path", "chat");
        return reply("💬 *PATH UPDATED*\nRecovered messages will be sent in the **Same Chat**.");
    }

    // STATUS CHECK
    const isOn = await getAnti("gc");
    const path = await getAnti("path") || "chat";

    return reply(
        "🦐 *ANTI DELETE SETTINGS*\n" +
        "━━━━━━━━━━━\n" +
        `📊 Status: *${isOn ? "ON 🟢" : "OFF 🔴"}*\n` +
        `📍 Path: *${path === "owner" ? "Owner DM 📥" : "Original Chat 💬"}*\n\n` +
        "💡 *Commands:*\n" +
        "• `.ad on` / `.ad off`\n" +
        "• `.ad owner` (Recover in DM)\n" +
        "• `.ad chat` (Recover here)"
    );
});

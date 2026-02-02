const { cmd } = require('../command');
const { getAnti, setAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ["ad"],
    desc: "Manage message recovery",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { reply, q, isCreator }) => {
    if (!isCreator) return reply("🚫 Owner only.");

    const args = q.toLowerCase().trim().split(/\s+/);
    const action = args[0];

    switch (action) {
        case "on":
            await setAnti("gc", true);
            await setAnti("dm", true);
            return reply("✅ AntiDelete is now **ON**.");

        case "off":
            await setAnti("gc", false);
            await setAnti("dm", false);
            return reply("❌ AntiDelete is now **OFF**.");

        case "chat":
            await setAnti("path", "chat"); // Saves choice to DB
            return reply("📍 Messages will be recovered **in the same chat**.");

        case "owner":
            await setAnti("path", "owner"); // Saves choice to DB
            return reply("📍 Messages will be recovered **in your DM**.");

        case "status":
            const gc = await getAnti("gc");
            const path = await getAnti("path") || "chat";
            return reply(`📊 *STATUS*\n• Active: ${gc ? "YES" : "NO"}\n• Destination: ${path === "owner" ? "Owner DM 📥" : "Same Chat 💬"}`);

        default:
            return reply("💡 *QUICK GUIDE*\n• `.ad on` / `.ad off` \n• `.ad chat` (Recover here)\n• `.ad owner` (Recover in DM)\n• `.ad status` ");
    }
});

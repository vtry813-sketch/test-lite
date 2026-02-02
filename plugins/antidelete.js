const { cmd } = require('../command');
const { setAnti, getAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ["ad"],
    desc: "Toggle anti delete",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { reply, q, isCreator }) => {

    if (!isCreator) return reply("🚫 Owner only.");

    const action = q?.toLowerCase();

    // TURN ON
    if (action === "on") {
        await setAnti("gc", true);
        await setAnti("dm", true);

        return reply(
            "🦐 *ANTI DELETE*\n" +
            "━━━━━━━━━━━\n" +
            "🟢 Status: *ON*\n" +
            "♻️ Deleted messages will be recovered"
        );
    }

    // TURN OFF (HARD DISABLE)
    if (action === "off") {
        await setAnti("gc", false);
        await setAnti("dm", false);

        return reply(
            "🦐 *ANTI DELETE*\n" +
            "━━━━━━━━━━━\n" +
            "🔴 Status: *OFF*\n" +
            "🗑️ Recovery fully disabled"
        );
    }

    // CURRENT STATUS (AUTO-DETECTED)
    const isOn = (await getAnti("gc")) === true;

    return reply(
        "🦐 *ANTI DELETE*\n" +
        "━━━━━━━━━━━\n" +
        `📊 Status: *${isOn ? "ON 🟢" : "OFF 🔴"}*\n\n` +
        "• `.antidelete on`\n" +
        "• `.antidelete off`"
    );
});

/**
 * Anti-Delete Handler
 * Stores incoming messages and recovers deleted messages
 * Can send recovered messages in the same chat or to bot owner DM
 */

const config = require("../config");

// Temporary in-memory store for messages
const messageStore = new Map();

/**
 * Store incoming messages
 * @param {object} message - incoming WhatsApp message
 */
function storeMessage(message) {
    if (!message?.key || !message.message) return;

    const msgId = message.key.id;

    // Skip deleted messages themselves
    if (message.message.protocolMessage) return;

    messageStore.set(msgId, message);

    // Auto-clean after 30 minutes
    setTimeout(() => {
        messageStore.delete(msgId);
    }, 30 * 60 * 1000);
}

/**
 * Handle deleted messages
 * @param {object} client - Baileys client
 * @param {object} message - deleted message event
 * @param {string} ownerJid - JID of bot owner
 */
async function handleDeletedMessage(client, message, ownerJid) {
    try {
        if (!message?.key || !message.message?.protocolMessage) return;
        if (!config.ANTI_DELETE || message.message.protocolMessage.type !== 0) return;

        const deletedId = message.message.protocolMessage.key.id;
        const recoveredMsg = messageStore.get(deletedId);
        if (!recoveredMsg) return;

        const originalSender = recoveredMsg.key.participant || recoveredMsg.key.remoteJid;

        // Decide target chat
        const targetChat = config.ANTI_DELETE_DM ? ownerJid : message.key.remoteJid;

        // Notify recovered message
        await client.sendMessage(targetChat, {
            text: `🚨 *ANTI DELETE ALERT*\n\n👤 From: @${originalSender.split("@")[0]}\n📩 Recovered message below 👇`,
            mentions: [originalSender]
        });

        // Re-send original message
        await client.relayMessage(targetChat, recoveredMsg.message, {
            messageId: recoveredMsg.key.id
        });

    } catch (err) {
        console.error("❌ Anti-Delete handler error:", err);
    }
}

/**
 * Expose functions
 */
module.exports = {
    storeMessage,
    handleDeletedMessage
};

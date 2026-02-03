const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');

const AntiDelete = async (conn, updates) => {
    try {
        for (const update of updates) {
            // Trigger only on deletion
            if (update.update.message === null) {
                const store = await loadMessage(update.key.id);
                if (!store || !store.message) continue;

                const isGroup = isJidGroup(store.jid);
                
                // --- MASTER SWITCH CHECK ---
                // If set to OFF, this will return false and the loop will skip (No recovery)
                const isEnabled = isGroup ? await getAnti('gc') : await getAnti('dm');
                if (!isEnabled) continue; 

                // --- PATH REDIRECTION ---
                const pathSetting = await getAnti('path') || 'chat';
                const targetJid = (pathSetting === "owner") ? conn.user.id : store.jid;

                const mek = store.message;
                const deleteTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
                const deleteDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                
                const senderJid = mek.key.participant || mek.key.remoteJid;
                const senderNumber = senderJid.split('@')[0];

                let deleteInfo = `📅 *DATE:* ${deleteDate}\n⏰ *TIME:* ${deleteTime}\n👤 *SENDER:* @${senderNumber}`;
                
                // Add Group Context if recovery is sent to your DM
                if (isGroup && pathSetting === "owner") {
                    try {
                        const groupMetadata = await conn.groupMetadata(store.jid);
                        deleteInfo += `\n👥 *GROUP:* ${groupMetadata.subject}`;
                    } catch { deleteInfo += `\n👥 *GROUP:* Unknown`; }
                }

                // --- EXECUTION ---
                if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                    const content = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '🚫 Content unavailable';
                    const fullMessage = `🗑️ *ANTIDELETE*\n\n${deleteInfo}\n\n✉️ *MESSAGE:*\n${content}`;
                    
                    await conn.sendMessage(targetJid, { text: fullMessage, mentions: [senderJid] }, { quoted: mek });
                } else {
                    const messageType = Object.keys(mek.message)[0];
                    const type = messageType.replace('Message', '');
                    const caption = `🗑️ *ANTIDELETE*\n\n${deleteInfo}`;

                    if (mek.message[messageType]?.url) {
                        await conn.sendMessage(targetJid, { 
                            [type]: { url: mek.message[messageType].url }, 
                            caption: caption,
                            mentions: [senderJid]
                        }, { quoted: mek });
                    }
                }
            }
        }
    } catch (error) {
        console.error('AntiDelete Logic Error:', error);
    }
};

module.exports = { AntiDelete };

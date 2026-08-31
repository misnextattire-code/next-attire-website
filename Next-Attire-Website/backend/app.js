/**
 * NEXT ATTIRE — Express app (routes + middleware only, no listen())
 * -----------------------------------------------------------
 * Kept separate from server.js so the exact same app can be:
 *  - run as a normal long-running server (server.js -> app.listen())
 *    for a VPS / GoDaddy cPanel Node.js App, or
 *  - wrapped as a serverless function (netlify/functions/api.js)
 *    for Netlify, where nothing ever calls app.listen().
 *
 *   GET  /api/health     -> uptime check
 *   POST /api/enquiry     -> business/retailer enquiry form
 *
 * Every enquiry is appended to backend/data/enquiries.json.
 * If SMTP_* env vars are set, an email notification is also sent.
 *
 * NOTE on Netlify: serverless functions run in short-lived, ephemeral
 * containers. Writes to enquiries.json are NOT reliably persisted there
 * (a cold start can reset the filesystem) — treat the JSON file as
 * best-effort on Netlify and configure SMTP_* so enquiries are always
 * emailed. On a VPS / GoDaddy Node.js App (a normal always-on process),
 * the JSON file works exactly as you'd expect.
 * -----------------------------------------------------------
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs/promises");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
const DATA_FILE = path.join(__dirname, "data", "enquiries.json");

const app = express();

// Trust the first proxy hop (needed behind Nginx / Netlify's edge so
// rate-limiting / logging see the real client IP, not an internal one).
app.set("trust proxy", 1);

app.use(express.json({ limit: "20kb" }));

// ---- CORS ----
// Same-origin requests (frontend served by this same app, or by Netlify
// in front of this function) don't need CORS at all. Only relevant if
// the frontend is ever hosted on a different domain than the backend.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);

// ---- Static frontend ----
// Only relevant when this app is run as a normal server (VPS / GoDaddy).
// On Netlify, static files are served directly by Netlify's CDN and this
// middleware is never reached (only /api/* is routed to the function).
app.use(express.static(FRONTEND_DIR, { extensions: ["html"] }));

// ---- Health check (useful for uptime monitors / load balancers) ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---- Enquiry form ----
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiries from this device. Please try again later." }
});

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Serializes writes to enquiries.json so concurrent submissions
// never clobber each other. Best-effort on Netlify (see note above).
let writeQueue = Promise.resolve();
function appendEnquiry(entry) {
  writeQueue = writeQueue.then(async () => {
    let list = [];
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      list = JSON.parse(raw);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    list.push(entry);
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
  });
  return writeQueue;
}

async function maybeSendEmail(entry) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return; // Email notifications are optional — skip silently if not configured.
  }
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: `"Next Attire Website" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_TO || process.env.SMTP_USER,
    replyTo: entry.email,
    subject: `New enquiry from ${entry.name} — Next Attire website`,
    text:
      `Name: ${entry.name}\n` +
      `Phone: ${entry.phone}\n` +
      `Email: ${entry.email}\n\n` +
      `Message:\n${entry.message}\n\n` +
      `Submitted: ${entry.submittedAt}`
  });
}

app.post("/api/enquiry", enquiryLimiter, async (req, res) => {
  const { name, phone, email, message } = req.body || {};

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: "Please fill in every field." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (String(message).length > 4000) {
    return res.status(400).json({ error: "Message is too long." });
  }

  const entry = {
    name: String(name).slice(0, 200),
    phone: String(phone).slice(0, 40),
    email: String(email).slice(0, 200),
    message: String(message).slice(0, 4000),
    submittedAt: new Date().toISOString(),
    ip: req.ip
  };

  try {
    // Fire the email first and await it here — on Netlify the function
    // container can be frozen the instant res.json() is sent, so a
    // fire-and-forget email (as on a normal always-on server) can get
    // cut off before it actually goes out.
    await Promise.allSettled([
      appendEnquiry(entry).catch((err) => console.error("Failed to save enquiry to file:", err.message)),
      maybeSendEmail(entry).catch((err) => console.error("Email notification failed:", err.message))
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to process enquiry:", err);
    res.status(500).json({ error: "Could not save your enquiry. Please try again." });
  }
});

// ---- Fallback: send index.html for any other GET (simple SPA-style catch-all) ----
// Only relevant when run as a normal server (VPS / GoDaddy) — see note above.
app.get("*", (req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

module.exports = app;

require("dotenv").config();
const express   = require("express");
const nodemailer = require("nodemailer");
const cors      = require("cors");
const path      = require("path");
const rateLimit = require("express-rate-limit");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── FIX 1: Trust Railway/proxy headers ─────────────────────
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set("trust proxy", 1);

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:        "ok",
    emailUser:     process.env.EMAIL_USER     ? "SET ✅" : "MISSING ❌",
    emailPass:     process.env.EMAIL_PASS     ? "SET ✅" : "MISSING ❌",
    receiverEmail: process.env.RECEIVER_EMAIL ? "SET ✅" : "MISSING ❌",
  });
});

// ── Rate limiter ─────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many submissions. Try again in an hour." },
});

// ── FIX 2: Use port 587 + STARTTLS explicitly ───────────────
// Railway blocks port 465 (SSL). Port 587 with STARTTLS works fine.
function makeTransporter() {
  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,          // false = STARTTLS (NOT SSL) — works on Railway
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // avoids cert issues on cloud servers
    },
    connectionTimeout: 15000,
    greetingTimeout:   15000,
    socketTimeout:     20000,
  });
}

// ── HTML email to business owner ─────────────────────────────
function buildEmailHTML(d) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Georgia,serif;background:#f4f0e8;margin:0;padding:0}
  .wrap{max-width:620px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)}
  .hdr{background:#0B1D3A;padding:32px 40px}
  .hdr h1{color:#E8A020;font-size:24px;margin:0}
  .hdr p{color:#7A8BA3;font-size:13px;margin:5px 0 0}
  .bdy{padding:32px 40px}
  .badge{display:inline-block;background:#FEF3DC;color:#B5760F;padding:5px 14px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:22px}
  .row{display:flex;gap:16px;padding:14px 0;border-bottom:1px solid #f0ebe0}
  .row:last-of-type{border-bottom:none}
  .lbl{width:150px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;flex-shrink:0;padding-top:3px}
  .val{font-size:14px;color:#111;font-weight:600}
  .rank{font-size:28px;color:#E8A020;font-weight:900;line-height:1}
  .msgbox{background:#f9f4ec;border-left:4px solid #E8A020;padding:14px 18px;border-radius:0 8px 8px 0;color:#555;font-size:13px;line-height:1.7;margin-top:8px;width:100%}
  .ftr{background:#0B1D3A;padding:18px 40px;text-align:center}
  .ftr p{color:#7A8BA3;font-size:12px;margin:0}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <h1>COMEDK<span style="color:#fff">racker</span></h1>
    <p>🎓 New Counselling Enquiry Received</p>
  </div>
  <div class="bdy">
    <div class="badge">🔥 New Lead</div>
    <div class="row"><div class="lbl">Name</div><div class="val">${d.firstName} ${d.lastName}</div></div>
    <div class="row"><div class="lbl">Phone / WhatsApp</div><div class="val"><a href="tel:${d.phone}" style="color:#0B1D3A">${d.phone}</a></div></div>
    <div class="row"><div class="lbl">Email</div><div class="val">${d.email || "Not provided"}</div></div>
    <div class="row"><div class="lbl">COMEDK Rank</div><div class="val rank">${d.rank}</div></div>
    <div class="row"><div class="lbl">Branch</div><div class="val">${d.branch || "Not specified"}</div></div>
    <div class="row"><div class="lbl">City</div><div class="val">${d.city || "Not provided"}</div></div>
    <div class="row" style="flex-direction:column">
      <div class="lbl">Message</div>
      <div class="msgbox">${d.message || "No message."}</div>
    </div>
  </div>
  <div class="ftr"><p>Sent via <strong style="color:#E8A020">COMEDKracker</strong> website contact form</p></div>
</div></body></html>`;
}

// ── Auto-reply to student ─────────────────────────────────────
function buildAutoReplyHTML(firstName, rank) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Georgia,serif;background:#f4f0e8;margin:0;padding:0}
  .wrap{max-width:600px;margin:40px auto;background:#0B1D3A;border-radius:12px;overflow:hidden}
  .hdr{padding:36px;text-align:center}
  .logo{font-size:26px;color:#fff}
  .logo span{color:#E8A020}
  .hdr p{color:#7A8BA3;font-size:13px}
  .bdy{background:#fff;padding:36px}
  .hi{font-size:20px;color:#0B1D3A;margin-bottom:12px}
  .bdy p{color:#555;line-height:1.8;font-size:14px;margin-bottom:14px}
  .rbox{background:#FEF3DC;border:2px solid #E8A020;border-radius:10px;padding:18px;text-align:center;margin:20px 0}
  .rl{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px}
  .rv{font-size:36px;font-weight:900;color:#E8A020;line-height:1.1}
  .cta{display:block;background:#25D366;color:#fff;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-top:20px}
  .ftr{padding:20px 36px;text-align:center}
  .ftr p{color:#7A8BA3;font-size:11px;margin:3px 0}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="logo">COMEDK<span>racker</span></div>
    <p>Karnataka's #1 COMEDK Counselling Service</p>
  </div>
  <div class="bdy">
    <div class="hi">Hi ${firstName}! 👋</div>
    <p>Thank you for contacting <strong>COMEDKracker</strong>. We've received your enquiry and our expert counsellor will contact you within <strong>24 hours</strong>.</p>
    <div class="rbox">
      <div class="rl">Your COMEDK Rank</div>
      <div class="rv">${rank}</div>
    </div>
    <p>We've helped <strong>5,000+ students</strong> secure great engineering colleges. You're in great hands!</p>
    <a class="cta" href="https://wa.me/919876543210">💬 Chat on WhatsApp Now</a>
  </div>
  <div class="ftr">
    <p><strong style="color:#E8A020">COMEDKracker</strong> | hello@comedkracker.com | +91 98765 43210</p>
  </div>
</div></body></html>`;
}

// ── POST /api/contact ─────────────────────────────────────────
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { firstName, lastName, phone, email, rank, branch, city, message } = req.body;

  console.log("📩 Submission:", { firstName, lastName, phone, rank });

  // Guard: env vars
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS missing!");
    return res.status(500).json({
      success: false,
      message: "Server email not configured. Please WhatsApp us at +91 98765 43210.",
    });
  }

  // Validate
  if (!firstName || !lastName || !phone || !rank) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields: Name, Phone, and Rank.",
    });
  }

  if (isNaN(rank) || Number(rank) < 1 || Number(rank) > 200000) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid COMEDK rank between 1 and 200000.",
    });
  }

  // Hard 25s timeout so form never hangs
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Request timed out. Please WhatsApp us at +91 98765 43210.",
      });
    }
  }, 25000);

  try {
    const transporter = makeTransporter();

    // 1️⃣ Email to owner
    await transporter.sendMail({
      from:    `"COMEDKracker" <${process.env.EMAIL_USER}>`,
      to:      process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      replyTo: email || undefined,
      subject: `🎓 New Enquiry — ${firstName} ${lastName} | Rank: ${rank}`,
      html:    buildEmailHTML({ firstName, lastName, phone, email, rank, branch, city, message }),
    });
    console.log("✅ Owner email sent");

    // 2️⃣ Auto-reply to student
    if (email && email.includes("@")) {
      await transporter.sendMail({
        from:    `"COMEDKracker" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `✅ Got your enquiry, ${firstName}! — COMEDKracker`,
        html:    buildAutoReplyHTML(firstName, rank),
      });
      console.log("✅ Student reply sent to", email);
    }

    clearTimeout(timer);
    if (!res.headersSent) {
      return res.json({
        success: true,
        message: "Enquiry sent! Our counsellor will contact you within 24 hours.",
      });
    }

  } catch (err) {
    clearTimeout(timer);
    console.error("❌ Email error:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: `Could not send email: ${err.message}. Please WhatsApp us at +91 98765 43210.`,
      });
    }
  }
});

// ── Serve frontend ────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 COMEDKracker running on port ${PORT}`);
  console.log(`   EMAIL_USER:     ${process.env.EMAIL_USER     || "❌ NOT SET"}`);
  console.log(`   EMAIL_PASS:     ${process.env.EMAIL_PASS     ? "✅ set"    : "❌ NOT SET"}`);
  console.log(`   RECEIVER_EMAIL: ${process.env.RECEIVER_EMAIL || "❌ NOT SET"}\n`);
});

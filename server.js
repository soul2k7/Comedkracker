require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const rateLimit = require("express-rate-limit");
const https     = require("https");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Trust Railway proxy ─────────────────────────────────────
app.set("trust proxy", 1);

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ── Health check ────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:   "ok",
    resendKey: process.env.RESEND_API_KEY ? "SET ✅" : "MISSING ❌",
    receiver:  process.env.RECEIVER_EMAIL ? "SET ✅" : "MISSING ❌",
    senderEmail: process.env.SENDER_EMAIL ? "SET ✅" : "MISSING ❌",
  });
});

// ── Rate limiter ────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many submissions. Try again in an hour." },
});

// ── Send email via Resend HTTP API (no SMTP, works on Railway) ──
function sendEmail({ to, subject, html, replyTo }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from:     process.env.SENDER_EMAIL || "COMEDKracker <onboarding@resend.dev>",
      to:       [to],
      subject,
      html,
      reply_to: replyTo || undefined,
    });

    const options = {
      hostname: "api.resend.com",
      path:     "/emails",
      method:   "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type":  "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request to Resend API timed out"));
    });

    req.write(body);
    req.end();
  });
}

// ── HTML email to business owner ────────────────────────────
function buildOwnerEmail(d) {
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
    <div class="row"><div class="lbl">Phone / WhatsApp</div><div class="val">${d.phone}</div></div>
    <div class="row"><div class="lbl">Email</div><div class="val">${d.email || "Not provided"}</div></div>
    <div class="row"><div class="lbl">COMEDK Rank</div><div class="val rank">${d.rank}</div></div>
    <div class="row"><div class="lbl">Branch</div><div class="val">${d.branch || "Not specified"}</div></div>
    <div class="row"><div class="lbl">City</div><div class="val">${d.city || "Not provided"}</div></div>
    <div class="row" style="flex-direction:column">
      <div class="lbl">Message</div>
      <div class="msgbox">${d.message || "No message."}</div>
    </div>
  </div>
  <div class="ftr"><p>Sent via <strong style="color:#E8A020">COMEDKracker</strong> website</p></div>
</div></body></html>`;
}

// ── Auto-reply to student ────────────────────────────────────
function buildStudentEmail(firstName, rank) {
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
    <p>Thank you for contacting <strong>COMEDKracker</strong>. Our expert counsellor will reach out to you within <strong>24 hours</strong>.</p>
    <div class="rbox">
      <div class="rl">Your COMEDK Rank</div>
      <div class="rv">${rank}</div>
    </div>
    <p>We've helped <strong>5,000+ students</strong> secure top engineering colleges. You're in great hands!</p>
    <a class="cta" href="https://wa.me/919876543210">💬 Chat on WhatsApp Now</a>
  </div>
  <div class="ftr">
    <p><strong style="color:#E8A020">COMEDKracker</strong> | hello@comedkracker.com | +91 98765 43210</p>
  </div>
</div></body></html>`;
}

// ── POST /api/contact ────────────────────────────────────────
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { firstName, lastName, phone, email, rank, branch, city, message } = req.body;

  console.log("📩 Submission:", { firstName, lastName, phone, rank });

  // Guard: env vars
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not set!");
    return res.status(500).json({
      success: false,
      message: "Server not configured. Please WhatsApp us at +91 98765 43210.",
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

  try {
    // 1️⃣ Email to owner
    await sendEmail({
      to:      process.env.RECEIVER_EMAIL || "hello@comedkracker.com",
      subject: `🎓 New Enquiry — ${firstName} ${lastName} | Rank: ${rank}`,
      html:    buildOwnerEmail({ firstName, lastName, phone, email, rank, branch, city, message }),
      replyTo: email || undefined,
    });
    console.log("✅ Owner email sent via Resend");

    // 2️⃣ Auto-reply to student
    if (email && email.includes("@")) {
      await sendEmail({
        to:      email,
        subject: `✅ Got your enquiry, ${firstName}! — COMEDKracker`,
        html:    buildStudentEmail(firstName, rank),
      });
      console.log("✅ Student reply sent to", email);
    }

    return res.json({
      success: true,
      message: "Enquiry sent! Our counsellor will contact you within 24 hours.",
    });

  } catch (err) {
    console.error("❌ Resend error:", err.message);
    return res.status(500).json({
      success: false,
      message: `Could not send email: ${err.message}. Please WhatsApp us at +91 98765 43210.`,
    });
  }
});

// ── Serve frontend ───────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 COMEDKracker running on port ${PORT}`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ set"    : "❌ NOT SET"}`);
  console.log(`   RECEIVER_EMAIL: ${process.env.RECEIVER_EMAIL || "❌ NOT SET"}`);
  console.log(`   SENDER_EMAIL:   ${process.env.SENDER_EMAIL   || "using default onboarding@resend.dev"}\n`);
});

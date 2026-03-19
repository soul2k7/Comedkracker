require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Rate limiter: max 5 contact form submissions per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many submissions from this IP. Please try again after an hour.",
  },
});

// ── Nodemailer Transporter ──────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // your Gmail: e.g. comedkracker@gmail.com
    pass: process.env.EMAIL_PASS,     // Gmail App Password (NOT your normal password)
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ Email transporter error:", err.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

// ── Helper: build beautiful HTML email ─────────────────────
function buildEmailHTML(data) {
  const { firstName, lastName, phone, email, rank, branch, city, message } = data;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Georgia, serif; background: #f4f0e8; margin: 0; padding: 0; }
    .wrapper { max-width: 620px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: #0B1D3A; padding: 36px 40px; }
    .header h1 { color: #E8A020; font-size: 26px; margin: 0; letter-spacing: -0.5px; }
    .header p { color: #7A8BA3; font-size: 13px; margin: 6px 0 0; }
    .body { padding: 36px 40px; }
    .badge { display: inline-block; background: #FEF3DC; color: #B5760F; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
    .row { display: flex; margin-bottom: 18px; border-bottom: 1px solid #f0ebe0; padding-bottom: 18px; }
    .row:last-of-type { border-bottom: none; }
    .label { width: 160px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; padding-top: 2px; flex-shrink: 0; }
    .value { font-size: 15px; color: #1a1a1a; font-weight: 600; }
    .rank-highlight { font-size: 22px; color: #E8A020; font-weight: 900; }
    .message-box { background: #f9f4ec; border-left: 4px solid #E8A020; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 8px; color: #444; font-size: 14px; line-height: 1.7; }
    .footer { background: #0B1D3A; padding: 20px 40px; text-align: center; }
    .footer p { color: #7A8BA3; font-size: 12px; margin: 0; }
    .footer strong { color: #E8A020; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>COMEDK<span style="color:#fff">racker</span></h1>
    <p>New Counselling Enquiry Received</p>
  </div>
  <div class="body">
    <div class="badge">🎓 New Lead</div>
    <div class="row">
      <div class="label">Full Name</div>
      <div class="value">${firstName} ${lastName}</div>
    </div>
    <div class="row">
      <div class="label">Phone / WhatsApp</div>
      <div class="value"><a href="tel:${phone}" style="color:#0B1D3A">${phone}</a></div>
    </div>
    <div class="row">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${email}" style="color:#0B1D3A">${email || "Not provided"}</a></div>
    </div>
    <div class="row">
      <div class="label">COMEDK Rank</div>
      <div class="value rank-highlight">${rank}</div>
    </div>
    <div class="row">
      <div class="label">Preferred Branch</div>
      <div class="value">${branch || "Not specified"}</div>
    </div>
    <div class="row">
      <div class="label">City / Location</div>
      <div class="value">${city || "Not provided"}</div>
    </div>
    <div class="row" style="flex-direction: column;">
      <div class="label" style="margin-bottom:10px;">Message</div>
      <div class="message-box">${message || "No message provided."}</div>
    </div>
  </div>
  <div class="footer">
    <p>Received via <strong>COMEDKracker</strong> contact form &nbsp;|&nbsp; Reply directly to the student's email above</p>
  </div>
</div>
</body>
</html>`;
}

// ── Auto-reply HTML email to student ───────────────────────
function buildAutoReplyHTML(firstName, rank) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Georgia, serif; background: #f4f0e8; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #0B1D3A; border-radius: 12px; overflow: hidden; }
    .header { padding: 40px; text-align: center; }
    .logo { font-size: 28px; color: #fff; margin-bottom: 6px; }
    .logo span { color: #E8A020; }
    .header p { color: #7A8BA3; font-size: 14px; }
    .body { background: #fff; padding: 40px; }
    .greeting { font-size: 22px; color: #0B1D3A; margin-bottom: 12px; }
    .body p { color: #555; line-height: 1.8; font-size: 15px; }
    .rank-box { background: #FEF3DC; border: 2px solid #E8A020; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .rank-box .label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .rank-box .rank { font-size: 36px; font-weight: 900; color: #E8A020; }
    .cta { display: block; background: #E8A020; color: #0B1D3A; text-align: center; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; text-decoration: none; margin-top: 28px; }
    .footer { padding: 24px 40px; text-align: center; }
    .footer p { color: #7A8BA3; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">COMEDK<span>racker</span></div>
    <p>Karnataka's #1 COMEDK Counselling Service</p>
  </div>
  <div class="body">
    <div class="greeting">Hi ${firstName}! 👋</div>
    <p>Thank you for reaching out to <strong>COMEDKracker</strong>. We've received your enquiry and our expert counsellor will contact you within <strong>24 hours</strong>.</p>
    <div class="rank-box">
      <div class="label">Your COMEDK Rank</div>
      <div class="rank">${rank}</div>
    </div>
    <p>We've helped <strong>5,000+ students</strong> find their perfect engineering college using exactly this rank range. You're in great hands!</p>
    <p>While you wait, feel free to WhatsApp us for any urgent queries:</p>
    <a class="cta" href="https://wa.me/919876543210">💬 Chat on WhatsApp Now</a>
  </div>
  <div class="footer">
    <p><strong style="color:#E8A020">COMEDKracker</strong> &nbsp;|&nbsp; hello@comedkracker.com &nbsp;|&nbsp; +91 98765 43210</p>
    <p style="margin-top:8px; color:#4a5a6a;">Bengaluru, Karnataka &nbsp;|&nbsp; Mon–Sat, 9AM–7PM</p>
  </div>
</div>
</body>
</html>`;
}

// ── POST /api/contact ───────────────────────────────────────
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { firstName, lastName, phone, email, rank, branch, city, message } = req.body;

  // Server-side validation
  if (!firstName || !lastName || !phone || !rank) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing: firstName, lastName, phone, rank.",
    });
  }

  if (isNaN(rank) || Number(rank) < 1 || Number(rank) > 200000) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid COMEDK rank.",
    });
  }

  try {
    // 1️⃣ Email to business owner
    await transporter.sendMail({
      from: `"COMEDKracker Website" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      replyTo: email || undefined,
      subject: `🎓 New Enquiry — ${firstName} ${lastName} | Rank: ${rank}`,
      html: buildEmailHTML(req.body),
    });

    // 2️⃣ Auto-reply to student (only if email provided)
    if (email) {
      await transporter.sendMail({
        from: `"COMEDKracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ We received your enquiry, ${firstName}! — COMEDKracker`,
        html: buildAutoReplyHTML(firstName, rank),
      });
    }

    console.log(`📧 Enquiry received from ${firstName} ${lastName} (Rank: ${rank})`);
    return res.json({
      success: true,
      message: "Enquiry sent successfully! We'll contact you within 24 hours.",
    });
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send enquiry. Please try again or WhatsApp us directly.",
    });
  }
});

// ── Catch-all: serve index.html ─────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 COMEDKracker server running at http://localhost:${PORT}`);
});

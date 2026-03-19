# COMEDKracker Website 🎓

#1 COMEDK College Counselling website — with a **fully working contact form** that sends emails via Node.js + Nodemailer.

---

## 📁 Project Structure

```
COMEDKracker/
├── server.js          ← Node.js + Express backend (email sending)
├── package.json       ← Dependencies
├── .env.example       ← Environment variable template
├── .env               ← YOUR secrets (create this, never commit it)
└── public/
    └── index.html     ← The entire frontend website
```

---

## 🚀 Setup Guide (Step-by-Step)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version recommended)

### Step 2 — Install dependencies
Open terminal in the `COMEDKracker` folder and run:
```bash
npm install
```

### Step 3 — Set up Gmail App Password
The backend uses Gmail to send emails. You need an **App Password** (not your normal Gmail password):

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is enabled
3. Search for **"App passwords"** → click it
4. Select app: **Mail**, device: **Other** → type "COMEDKracker" → Generate
5. Copy the **16-character code** shown

### Step 4 — Create your .env file
Copy the example file:
```bash
cp .env.example .env
```

Then open `.env` and fill in your values:
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx    ← 16-char App Password
RECEIVER_EMAIL=hello@comedkracker.com   ← where you receive leads
PORT=3000
```

### Step 5 — Start the server
```bash
npm start
```

You'll see:
```
✅ Email transporter ready
🚀 COMEDKracker server running at http://localhost:3000
```

### Step 6 — Open the website
Go to: **http://localhost:3000**

---

## 📧 How the Contact Form Works

When a student submits the form:

1. **Validation** — Server validates required fields (name, phone, rank)
2. **Rate limiting** — Max 5 submissions per IP per hour (prevents spam)
3. **Email to you** — A beautifully formatted HTML email with all student details lands in your inbox
4. **Auto-reply to student** — If they provided an email, they get a branded confirmation email with WhatsApp link
5. **Success/error feedback** — The form shows a clear success or error message

---

## 🌐 Deploy to Production

### Option A: Render (Free)
1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect repo, set **Build Command**: `npm install`, **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Done! You get a free HTTPS URL

### Option B: Railway (Free tier)
1. Go to https://railway.app
2. Deploy from GitHub → add environment variables
3. Get your live URL instantly

### Option C: VPS / cPanel
1. Upload files to server
2. Install Node.js on your VPS
3. Set environment variables
4. Run with PM2: `pm2 start server.js --name comedkracker`

---

## 🔧 Customisation

| What to change | Where |
|---|---|
| Phone number | `public/index.html` — search `+91 98765 43210` |
| Email address | `public/index.html` & `.env` → `RECEIVER_EMAIL` |
| Office address | `public/index.html` — contact section |
| Testimonials | `public/index.html` — testimonials section |
| Stats (5000+ students etc.) | `public/index.html` — hero section |
| Gmail account | `.env` → `EMAIL_USER` + `EMAIL_PASS` |

---

## 🛡️ Security Features
- Rate limiting (5 submissions/hour per IP)
- Server-side input validation
- Environment variables for secrets (never exposed to browser)
- CORS protection

---

Built with ❤️ for COMEDKracker

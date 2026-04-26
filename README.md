# COMEDKracker Website

Premium COMEDK college counselling website with Vercel serverless email backend.

---

## 📁 Project Structure

```
comedkracker-site/
├── index.html          ← Main website (all CSS + JS inline)
├── api/
│   └── contact.js      ← Vercel serverless function (email handler)
├── package.json        ← Node dependencies (nodemailer)
├── vercel.json         ← Vercel routing config
├── .env.example        ← Environment variable reference
└── README.md
```

---

## 🚀 Deploy to Vercel — Step by Step

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create comedkracker --public --push
# OR manually create repo at github.com and push
```

### Step 2 — Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Connect your GitHub account and select the repo
3. Leave all build settings as default (Framework: **Other**)
4. Click **Deploy** (it will fail without env vars — that's okay)

### Step 3 — Set Environment Variables
In your Vercel project dashboard:
1. Go to **Settings → Environment Variables**
2. Add these three variables:

| Name | Value |
|------|-------|
| `GMAIL_USER` | your Gmail address |
| `GMAIL_APP_PASSWORD` | your Gmail App Password (see below) |
| `RECIPIENT_EMAIL` | where to receive enquiries |

### Step 4 — Get a Gmail App Password
1. Visit [myaccount.google.com](https://myaccount.google.com)
2. **Security → 2-Step Verification** (must be enabled)
3. **Security → App Passwords**
4. Select **Mail** + name it "COMEDKracker"
5. Copy the 16-character password → paste as `GMAIL_APP_PASSWORD`

### Step 5 — Redeploy
After adding env vars:
- **Deployments tab → ⋯ menu → Redeploy**

### Step 6 — Done! ✅
Your site is live at `your-project.vercel.app`

---

## 🧪 Local Development

```bash
npm install -g vercel
npm install

# Create .env from example
cp .env.example .env
# Fill in your values in .env

# Run locally
vercel dev
```

Visit `http://localhost:3000`

---

## 📧 How the Email System Works

When a user submits the contact form:
1. The browser POSTs data to `/api/contact`
2. The Vercel serverless function validates the input
3. **Email 1** → Sent to `RECIPIENT_EMAIL` with full enquiry details + WhatsApp quick-action button
4. **Email 2** → Auto-reply sent to the student (if they provided their email)

---

## ✏️ Customisation

### Change phone number / email
Search and replace in `index.html`:
- `+91 76518 10417` → your number
- `comedkracker@gmail.com` → your email
- `917651810417` → your number (in WhatsApp links)

### Change brand name / colors
Edit CSS variables at the top of `index.html`:
```css
:root {
  --gold: #C9A84C;     /* primary accent */
  --bg: #0D0D0D;       /* background */
  ...
}
```

### Add/remove services or testimonials
Directly edit the HTML sections with comments like `<!-- ─── SERVICES ─── -->`

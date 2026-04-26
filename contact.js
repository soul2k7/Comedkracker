const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    firstName,
    lastName,
    phone,
    email,
    rank,
    branch,
    city,
    message,
  } = req.body;

  // Basic validation
  if (!firstName || !phone || !rank) {
    return res
      .status(400)
      .json({ error: "First name, phone, and rank are required." });
  }

  // Configure Gmail transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const submittedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  // HTML email to the business owner
  const ownerMailOptions = {
    from: `"COMEDKracker Enquiries" <${process.env.GMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
    subject: `🎓 New Enquiry — Rank ${rank} | ${firstName} ${lastName || ""}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Enquiry</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2416 100%);padding:36px 40px;border-bottom:2px solid #C9A84C;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:13px;letter-spacing:3px;color:#C9A84C;text-transform:uppercase;font-weight:600;margin-bottom:8px;">COMEDKracker</div>
                  <div style="font-size:26px;font-weight:700;color:#ffffff;">New Student Enquiry</div>
                  <div style="font-size:13px;color:#888;margin-top:6px;">${submittedAt} IST</div>
                </td>
                <td align="right">
                  <div style="background:#C9A84C;color:#0f0f0f;font-size:11px;font-weight:800;letter-spacing:2px;padding:8px 16px;border-radius:20px;text-transform:uppercase;">Action Required</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rank Badge -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#2d2416,#1f1a10);border:1px solid #C9A84C33;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;">
                  <div style="font-size:11px;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;font-weight:600;margin-bottom:4px;">COMEDK Rank</div>
                  <div style="font-size:42px;font-weight:800;color:#C9A84C;line-height:1;">${rank}</div>
                </td>
                <td style="padding:24px 28px;border-left:1px solid #C9A84C22;">
                  <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;font-weight:600;margin-bottom:4px;">Preferred Branch</div>
                  <div style="font-size:18px;font-weight:700;color:#ffffff;">${branch || "Not specified"}</div>
                </td>
                <td style="padding:24px 28px;border-left:1px solid #C9A84C22;">
                  <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;font-weight:600;margin-bottom:4px;">City</div>
                  <div style="font-size:18px;font-weight:700;color:#ffffff;">${city || "Not specified"}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Student Details -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="font-size:11px;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;font-weight:600;margin-bottom:16px;">Student Details</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Full Name</div>
                  <div style="font-size:16px;color:#ffffff;font-weight:600;">${firstName} ${lastName || ""}</div>
                </td>
                <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Phone / WhatsApp</div>
                  <div style="font-size:16px;color:#C9A84C;font-weight:600;">+91 ${phone}</div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Email Address</div>
                  <div style="font-size:16px;color:#ffffff;">${email || "Not provided"}</div>
                </td>
                <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                  <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">City</div>
                  <div style="font-size:16px;color:#ffffff;">${city || "Not specified"}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${
          message
            ? `
        <!-- Message -->
        <tr>
          <td style="padding:0 40px;">
            <div style="background:#111;border-left:3px solid #C9A84C;border-radius:0 8px 8px 0;padding:20px 24px;margin-top:8px;">
              <div style="font-size:11px;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;font-weight:600;margin-bottom:8px;">Message</div>
              <div style="font-size:15px;color:#ccc;line-height:1.6;">${message}</div>
            </div>
          </td>
        </tr>`
            : ""
        }

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C9A84C;border-radius:8px;padding:14px 28px;">
                  <a href="https://wa.me/91${phone}" style="color:#0f0f0f;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;">📱 WhatsApp ${firstName} Now</a>
                </td>
                ${
                  email
                    ? `<td width="16"></td>
                <td style="border:1px solid #C9A84C33;border-radius:8px;padding:14px 28px;">
                  <a href="mailto:${email}" style="color:#C9A84C;text-decoration:none;font-size:14px;font-weight:600;">✉️ Send Email</a>
                </td>`
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;padding:20px 40px;border-top:1px solid #222;">
            <div style="font-size:12px;color:#555;">This is an automated notification from <strong style="color:#C9A84C;">COMEDKracker</strong> contact form.</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };

  // Auto-reply to student (only if email provided)
  const studentMailOptions = email
    ? {
        from: `"COMEDKracker" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `We received your enquiry, ${firstName}! 🎓`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a,#2d2416);padding:40px;text-align:center;">
            <div style="font-size:11px;letter-spacing:4px;color:#C9A84C;text-transform:uppercase;font-weight:700;margin-bottom:12px;">COMEDKracker</div>
            <div style="font-size:28px;font-weight:800;color:#ffffff;margin-bottom:8px;">We've Got Your Enquiry!</div>
            <div style="font-size:15px;color:#aaa;">Our counsellor will reach out within 24 hours</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="font-size:16px;color:#333;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
            <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">
              Thank you for reaching out to COMEDKracker! We've received your enquiry for <strong>COMEDK Rank ${rank}</strong> and our expert counsellor will contact you on <strong style="color:#C9A84C;">+91 ${phone}</strong> within 24 hours.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Your Rank</div>
                  <div style="font-size:22px;font-weight:800;color:#C9A84C;">${rank}</div>
                </td>
                <td style="padding:20px 24px;border-left:1px solid #e8e0d0;">
                  <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Branch Interest</div>
                  <div style="font-size:16px;font-weight:700;color:#333;">${branch || "Flexible"}</div>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#777;line-height:1.6;margin:0 0 28px;">
              In the meantime, you can WhatsApp us directly for any urgent queries. We're here Monday–Saturday, 9 AM – 7 PM.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a1a;border-radius:8px;padding:14px 28px;">
                  <a href="https://wa.me/917651810417" style="color:#C9A84C;text-decoration:none;font-size:14px;font-weight:700;">📱 Chat on WhatsApp</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f0ebe0;padding:20px 40px;text-align:center;border-top:1px solid #e0d8cc;">
            <div style="font-size:12px;color:#999;">© 2025 COMEDKracker · <a href="mailto:comedkracker@gmail.com" style="color:#C9A84C;text-decoration:none;">comedkracker@gmail.com</a></div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }
    : null;

  try {
    await transporter.sendMail(ownerMailOptions);
    if (studentMailOptions) {
      await transporter.sendMail(studentMailOptions);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
}

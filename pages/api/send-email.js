import formData from "form-data";
import Mailgun from "mailgun.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { to, subject, html } = req.body;
  console.log("📨 Sending email to:", to);

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    const emailResponse = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: process.env.MAILGUN_FROM,
      to: to,
      subject: subject,
      html: html,
    });

    console.log("✅ Email sent successfully:", emailResponse);
    return res.status(200).json({ success: true, emailResponse });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

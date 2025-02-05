import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { to, subject, message } = req.body;

  try {
    const data = await resend.emails.send({
      from: process.env.SUPPORT_EMAIL,
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      name,
      email, // Capture customer email
      problem_statement,
      priority,
      status,
      area,
      tool_id,
      wings_order,
      part_number,
      supplier,
    } = req.body;

    // Generate unique Issue ID (Lastname-00001 format)
    const lastName = name.split(" ").pop(); // Get last name
    const { count } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true });
    const issueId = `${lastName}-${String(count + 1).padStart(5, "0")}`;

    // Insert ticket into Supabase
    const { data, error } = await supabase.from("tickets").insert([
      {
        issue_id: issueId,
        name,
        email, // Store email in the database
        problem_statement,
        priority,
        status,
        area,
        tool_id,
        wings_order,
        part_number,
        supplier,
      },
    ]);

    if (error) {
      console.error("Database Insert Error:", error);
      return res.status(500).json({ error: "Failed to submit ticket" });
    }

    // Send email notification to support
    await resend.emails.send({
      from: process.env.SUPPORT_EMAIL,
      to: "support@yourdomain.com", // Replace with actual support email
      subject: "New Support Ticket Submitted",
      html: `
        <p><strong>New Ticket Created</strong></p>
        <p><strong>Issue ID:</strong> ${issueId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Problem:</strong> ${problem_statement}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Tool ID:</strong> ${tool_id}</p>
        <p><strong>Wings Order:</strong> ${wings_order}</p>
        <p><strong>Part Number:</strong> ${part_number}</p>
        <p><strong>Supplier:</strong> ${supplier}</p>
      `,
    });

    // Send email confirmation to the customer
    await resend.emails.send({
      from: process.env.SUPPORT_EMAIL,
      to: email, // Send email to the customer
      subject: `Ticket Received: ${issueId}`,
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for submitting your support ticket. Below are the details:</p>
        <p><strong>Issue ID:</strong> ${issueId}</p>
        <p><strong>Problem:</strong> ${problem_statement}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Tool ID:</strong> ${tool_id}</p>
        <p><strong>Wings Order:</strong> ${wings_order}</p>
        <p><strong>Part Number:</strong> ${part_number}</p>
        <p><strong>Supplier:</strong> ${supplier}</p>
        <p>Our team will review your request and get back to you as soon as possible.</p>
        <p>Best regards,</p>
        <p>Fetch Ticket System Support</p>
      `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Ticket submitted successfully", data });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

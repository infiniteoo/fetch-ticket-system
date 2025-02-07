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
    const { issue_id, status, comment, commenter } = req.body;

    // Fetch the existing ticket
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("issue_id", issue_id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Update the status if provided
    if (status) {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ status })
        .eq("issue_id", issue_id);

      if (updateError) {
        return res.status(500).json({ error: "Failed to update status" });
      }
    }

    // Add a new comment if provided
    let newComments = ticket.comments ? JSON.parse(ticket.comments) : [];
    if (comment) {
      newComments.push({
        commenter,
        text: comment,
        timestamp: new Date().toLocaleString(),
      });

      const { error: commentError } = await supabase
        .from("tickets")
        .update({ comments: JSON.stringify(newComments) })
        .eq("issue_id", issue_id);

      if (commentError) {
        return res.status(500).json({ error: "Failed to add comment" });
      }
    }

    // Send email notification to support
    await resend.emails.send({
      from: process.env.SUPPORT_EMAIL,
      to: "support@yourdomain.com", // Replace with actual support email
      subject: `Ticket Update: ${issue_id}`,
      html: `
        <p><strong>Ticket Updated</strong></p>
        <p><strong>Issue ID:</strong> ${issue_id}</p>
        <p><strong>Updated Status:</strong> ${status || ticket.status}</p>
        <p><strong>New Comment:</strong> ${comment || "No comment added"}</p>
        <p><strong>By:</strong> ${commenter}</p>
      `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Ticket updated successfully" });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();
    if (error) console.error("Error fetching ticket:", error);
    else {
      setTicket(data);
      setStatus(data.status);
      fetchComments();
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: false });
    if (!error) setComments(data);
  };

  const updateStatus = async () => {
    await supabase.from("tickets").update({ status }).eq("id", id);
    alert("Status updated!");

    // Send email notification to user
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "customer@example.com", // Replace with customer's email
        subject: "Your Support Ticket Has Been Updated",
        message: `
          <strong>Your ticket has been updated.</strong><br />
          <strong>Issue ID:</strong> ${ticket.issue_id}<br />
          <strong>New Status:</strong> ${status}<br />
        `,
      }),
    });
  };

  const addComment = async (fileUrl = null) => {
    if (!comment && !fileUrl) return;
    await supabase
      .from("comments")
      .insert([{ ticket_id: id, text: comment, file_url: fileUrl }]);
    setComment("");
    setFile(null);
    fetchComments();
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `tickets/${id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("ticket-uploads")
      .upload(filePath, file);

    setUploading(false);

    if (error) {
      console.error("Upload error:", error);
      alert("File upload failed");
    } else {
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-uploads/${filePath}`;
      await addComment(fileUrl);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      {ticket ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Ticket Details</h1>
          <p>
            <strong>Issue ID:</strong> {ticket.issue_id}
          </p>
          <p>
            <strong>Name:</strong> {ticket.name}
          </p>
          <p>
            <strong>Problem:</strong> {ticket.problem_statement}
          </p>

          <label className="block mt-4">
            <span className="text-gray-700">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="New Request">New Request</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
          <button
            onClick={updateStatus}
            className="bg-blue-500 text-white p-2 rounded mt-2"
          >
            Update Status
          </button>

          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Comments</h2>
            {comments.map((c) => (
              <div key={c.id} className="border p-2 rounded mb-2">
                <p>{c.text}</p>
                {c.file_url && (
                  <a
                    href={c.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Attachment
                  </a>
                )}
              </div>
            ))}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border p-2 rounded w-full mt-2"
              placeholder="Add a comment..."
            ></textarea>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-2"
            />

            <button
              onClick={file ? handleFileUpload : () => addComment()}
              className="bg-green-500 text-white p-2 rounded mt-2"
            >
              {uploading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </>
      ) : (
        <p>Loading ticket...</p>
      )}
    </div>
  );
}

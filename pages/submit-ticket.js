import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

import {
  RefreshCw,
  Filter,
  Trash,
  CheckSquare,
  MessageCircle,
  Search,
} from "lucide-react";
import { Button } from "../components/ui/Button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitTicket() {
  const router = useRouter();
  const { issue_id } = router.query; // Get issue ID from URL query
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // Stores the selected file
  const [imagePreview, setImagePreview] = useState(null); // Preview before upload
  const [enlargedImage, setEnlargedImage] = useState(null); // Image for popup
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingTicketLoaded, setIsExistingTicketLoaded] = useState(false);
  const [form, setForm] = useState({
    name: "",
    problem_statement: "",
    priority: "Medium",
    fab_submitted_as: "",
    tool_id: "",
    wiings_order: "",
    part_number: "",
    status: "New Request",
    area: "Buyer/Planner",
    supplier: "AMAT",
    email: "",
  });

  useEffect(() => {
    if (issue_id) {
      setSearchQuery(issue_id); // Pre-fill the search field
      loadExistingTicket(issue_id); // Auto-load the ticket
    }
  }, [issue_id]); // Runs when the issue_id is present

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Show preview before upload
    }
  }

  // Upload image to Supabase Storage & return URL
  async function uploadImage(file) {
    if (!file) return null;

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("ticket-uploads")
      .upload(fileName, file);

    console.log("Upload Response Data:", data); // 🔍 Check the returned data
    console.log("Upload Error:", error); // 🔍 Check if there’s an error

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Manually construct the public URL
    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-uploads/${data.path}`;
    console.log("Manually Constructed URL:", bucketUrl); // ✅ Should log a valid image URL

    return bucketUrl;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // Add comment (handles both text & image)
  async function addComment() {
    if (!newComment.trim() && !selectedImage) return;

    const commenterName = form.name || "Anonymous";
    let imageUrl = null;

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    const utcTimestamp = new Date().toLocaleString();

    // Insert new comment
    const { error: commentError } = await supabase.from("comments").insert({
      ticket_id: form.id,
      text: newComment,
      commenter_name: commenterName,
      image_url: imageUrl,
      created_at: utcTimestamp, // ✅ Store UTC timestamp
    });

    if (commentError) {
      console.error("Error adding comment:", commentError);
      return;
    }

    // Update ticket's last updated time
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ updated_at: utcTimestamp })
      .eq("id", form.id);

    if (updateError) {
      console.error("Error updating ticket timestamp:", updateError);
    }

    // 🔥 Fetch fresh comments **AFTER** inserting new comment
    await fetchComments(form.id);

    // 💡 Get fresh comments **IMMEDIATELY** after fetchComments
    let { data: latestComments, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("ticket_id", form.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching updated comments:", fetchError);
      return;
    }

    console.log("📢 Latest Comments:", latestComments);

    // Format the latest comments for the email
    const commentSection = latestComments.length
      ? latestComments
          .map(
            (c) => `
        <tr>
          <td>${c.commenter_name || "Unknown"}</td>
          <td>${c.text || "No comment text"}</td>
          <td>${new Date(c.created_at).toLocaleString()}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="text-align:center;">No comments yet</td></tr>`;

    // Construct email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has received a new comment. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${form.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
        <h3>📝 New Comments</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0073e6;color:white;">
              <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
              <th style="padding:10px;border:1px solid #ddd;">Message</th>
              <th style="padding:10px;border:1px solid #ddd;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${commentSection}
          </tbody>
        </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${fo.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;

    // Send email
    const emailResponse = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: form.email,
        subject: `Your Support Ticket (#${form.issue_id}) - Fetch Ticket System *New Comment*`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("📨 Email Result:", emailResult);

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error);
    }

    setNewComment("");
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function fetchComments(ticketId) {
    console.log("Fetching comments for ticket:", ticketId);
    let { data, error } = await supabase
      .from("comments")
      .select("text, created_at, commenter_name, image_url") // ✅ Include image_url
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false }); // Newest first

    if (!error) {
      setComments(data);
    } else {
      console.error("Error fetching comments:", error);
    }
  }

  const generateIssueID = async () => {
    const lastName = form.name.split(" ").pop() || "User";
    const { data, error } = await supabase
      .from("tickets")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    const newId = data?.[0]?.id
      ? String(data[0].id + 1).padStart(5, "0")
      : "00001";
    return `${lastName}-${newId}`;
  };

  const loadExistingTicket = async (issue_id) => {
    if (!issue_id) return;
    const { data, error } = await supabase
      .from("tickets")
      .select()
      .eq("issue_id", issue_id)
      .single();
    if (error) {
      toast.error("❌ Error loading ticket. Please try again.");
    } else {
      setForm(data);
      console.log("loaded ticket", data);
      toast.success("✅ Ticket loaded successfully!");
      setIsExistingTicketLoaded(true);
    }

    // load comments too
    fetchComments(data.id);
  };

  const sendUpdateEmail = async (commentText) => {
    if (!commentText.trim()) return; // Skip if no changes

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has been updated. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${form.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
        <h3>📝 Changes Made</h3>
        <p>${commentText}</p>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${fo.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;

    const emailResponse = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: form.email,
        subject: `Your Support Ticket (#${form.issue_id}) - Fetch Ticket System *Updated*`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("📨 Email Result:", emailResult);

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log("Updating ticket:", form);

    let commentText = "";
    const commenterName = form.name || "Anonymous";
    const localTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });

    // Fetch current ticket from Supabase to compare values
    const { data: currentTicket, error: fetchError } = await supabase
      .from("tickets")
      .select()
      .eq("id", form.id)
      .single();

    if (fetchError) {
      console.error("Error fetching ticket before update:", fetchError);
      toast.error("❌ Error updating ticket. Please try again.");
      return;
    }
    toast.success("✅ Successfully updating ticket.");
    // Compare each field and add comments for changes
    Object.keys(form).forEach((key) => {
      if (form[key] !== currentTicket[key]) {
        commentText += `${key.replace(/_/g, " ")} updated to "${form[key]}". `;
      }
    });

    // Insert a comment if any changes were detected
    if (commentText) {
      const { error: commentError } = await supabase.from("comments").insert({
        ticket_id: form.id,
        text: commentText.trim(),
        commenter_name: commenterName,
        created_at: localTimestamp,
      });

      if (commentError) {
        console.error("Error adding comment for field changes:", commentError);
      }
    }

    // Update the ticket
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ...form,
        updated_at: localTimestamp,
      })
      .eq("id", form.id);

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      toast.error("❌ Error updating ticket. Please try again.");
    } else {
      await fetchComments(form.id); // Refresh comments
      await sendUpdateEmail(commentText); // Send an email with the changes
      toast.success("✅ Ticket updated successfully!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const issue_id = await generateIssueID();

    // set status to new request
    form.status = "New Request";

    // Insert ticket into Supabase
    const { error } = await supabase
      .from("tickets")
      .insert([{ ...form, issue_id, created_at: new Date().toLocaleString() }]);

    if (error) {
      toast.error("❌ Error submitting ticket. Please try again.");
      return;
    }

    // get comments for ticket if they exist
    await fetchComments(issue_id);
    let commentSection = [];
    // check to se if comments has any data
    if (comments) {
      commentSection = comments
        .map(
          (c) => `
        <tr>
          <td>${c.commenter_name || "Unknown"}</td>
          <td>${c.text || "No comment text"}</td>
          <td>${new Date(c.created_at).toLocaleString()}</td>
        </tr>
      `
        )
        .join("");
    } else {
      commentSection = `<tr><td colspan="3" style="text-align:center;">No comments yet</td></tr>`;
    }

    // Construct email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Confirmation</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has been submitted successfully. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${issue_id}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
         <h3>Comments</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#0073e6;color:white;">
                <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
                <th style="padding:10px;border:1px solid #ddd;">Message</th>
                <th style="padding:10px;border:1px solid #ddd;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${commentSection}
            </tbody>
          </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${fo.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;

    // Send email via API route
    const emailResponse = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: form.email,
        subject: `Your Support Ticket (#${issue_id}) - Fetch Ticket System`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("📨 Email Result:", emailResult);

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error);
    }

    toast.success("🎉 Ticket submitted successfully, and email has been sent!");

    // Reset form
    setForm({
      name: "",
      problem_statement: "",
      priority: "Not Assigned",
      fab_submitted_as: "",
      tool_id: "",
      wiings_order: "",
      part_number: "",
      status: "New Request",
      area: "Buyer/Planner",
      supplier: "AMAT",
      email: "",
    });
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-bold mb-4 text-black">
          Submit a Support Ticket 🎟️
        </h1>
        <div className="flex flex-row justify-evenly items-center">
          <input
            type="text"
            placeholder="Search Tickets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-lg text-black"
          />
          <div className="ml-1">
            <Button onClick={() => loadExistingTicket(searchQuery)}>
              <Search className="w-6 h-6 " />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-4 text-black"
          >
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="border p-2 rounded text-black"
              required
            />
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email"
              className="border p-2 rounded"
              required
            />

            <textarea
              name="problem_statement"
              value={form.problem_statement}
              onChange={handleChange}
              placeholder="Describe the problem"
              className="border p-2 rounded col-span-2"
              required
            />

            <div className="flex flex-col text-gray-500">
              <label htmlFor="priority">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                {[
                  "High",
                  "Medium",
                  "Low",
                  "Not Assigned",
                  "Factory Constraint",
                  "Non-Factory",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="fab_submitted_as">Fab Submitted As</label>
              <input
                type="text"
                name="fab_submitted_as"
                value={form.fab_submitted_as}
                onChange={handleChange}
                placeholder="Fab Submitted As"
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="tool_id">Tool ID</label>
              <input
                type="text"
                name="tool_id"
                value={form.tool_id}
                onChange={handleChange}
                placeholder="Tool ID"
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="wiings_order">Wiings Order</label>
              <input
                type="text"
                name="wiings_order"
                value={form.wiings_order}
                onChange={handleChange}
                placeholder="Wiings Order"
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="part_number">Part Number</label>
              <input
                type="text"
                name="part_number"
                value={form.part_number}
                onChange={handleChange}
                placeholder="Part Number"
                className="border p-2 rounded"
              />
            </div>

            {/* add label that says Status above the select dropdown */}
            <div className="flex flex-col text-gray-500">
              <label htmlFor="status">Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                {[
                  "New Request",
                  "In Progress",
                  "OM Escalated",
                  "Waiting 3PL",
                  "Closed",
                  "Canceled By User",
                  "Re-Opened",
                  "Waiting Buyer/Supplier",
                  "Waiting Customer",
                  "Waiting Elevator Repair",
                  "Waiting on IT",
                  "Waiting Tool Move",
                  "Exceptions / Variants",
                  "Waiting Chemicals",
                  "Waiting Count/Verify",
                  "Waiting Delivery Confirmation",
                  "Waiting Distribution",
                  "Waiting ePart",
                  "Waiting Inbound",
                  "Waiting IMO",
                  "Waiting Inv Control",
                  "Waiting Put-away",
                  "Waiting Returns",
                  "Waiting Shipping",
                  "Waiting Si",
                  "Waiting Stores",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="area">Area</label>
              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                {[
                  "Buyer/Planner",
                  "Dielectrics",
                  "Diffusion",
                  "Etch - Dry",
                  "Etch - Wet",
                  "IMO",
                  "Implant",
                  "Litho",
                  "Metals",
                  "Planar",
                  "RA4 SORT",
                  "RA4 STO",
                  "RA4 WLA",

                  "Subfab",
                  "Thin Films",
                  "TSV",
                  "VSE",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col text-gray-500">
              <label htmlFor="supplier">Supplier</label>
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                {[
                  "AMAT",
                  "ASM",
                  "ASML",
                  "DSV/UTI",
                  "Ebara",
                  "Edwards",
                  "Hitachi",
                  "JX Nippon",
                  "KLA",
                  "LAM",
                  "MSR",
                  "Nikon",
                  "Not Listed",
                  "Pentagon",
                  "Praxair/Linde",
                  "Quantum Clean",
                  "Screen",
                  "TEl",
                  "UPPRO",
                  "VWR",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {isExistingTicketLoaded ? (
              <Button onClick={handleUpdate}>Update Ticket</Button>
            ) : (
              <Button type="submit">Submit Ticket</Button>
            )}
          </form>
        </div>
        <div>
          <div className="w-full flex flex-col ml-4">
            <h3 className="text-2xl font-bold mb-4">Comments</h3>

            {/* Comment Thread (Scrollable) */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded text-black min-h-[250px] max-h-[250px] max-w-[400px]">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div
                    key={index}
                    className={`p-3 mb-2 rounded-lg ${
                      index % 2 === 0 ? "bg-gray-200" : "bg-gray-300"
                    }`}
                  >
                    {/* Commenter Name & Date */}
                    <p className="text-sm text-gray-600 font-semibold">
                      {comment.commenter_name || "Unknown"} -{" "}
                      {new Date(comment.created_at).toLocaleString()}
                    </p>

                    {/* Comment Text */}
                    {comment.text && (
                      <p className="text-black mt-1">{comment.text}</p>
                    )}

                    {/* Display Image (if exists) */}
                    {comment.image_url && (
                      <img
                        src={comment.image_url}
                        alt="Comment attachment"
                        className="mt-2 w-16 h-16 object-cover cursor-pointer rounded-lg border"
                        onClick={() => setEnlargedImage(comment.image_url)}
                      />
                    )}

                    {/* Divider */}
                    {index < comments.length - 1 && (
                      <hr className="mt-2 border-gray-400" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-black">No comments yet</p>
              )}
            </div>

            {/* Comment Input & Upload Section */}
            <div className="mt-4 flex justify-between flex-col gap-2">
              <textarea
                className="w-full p-3 border rounded text-black min-h-[100px]"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>

              {/* Submit Button */}
              <div className="flex flex-row justify-between">
                <Button variant="primary" onClick={addComment}>
                  <MessageCircle className="w-5 h-5" />
                </Button>
                {/* File Upload Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file:bg-blue-50 file:text-blue-700 file:px-4 file:py-2 file:rounded-lg file:border-0 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="relative ">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg border"
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 text-xs"
                      >
                        ✖
                      </button>
                    </div>
                  )}
                </div>
                {/* Enlarged Image Popup */}
                {enlargedImage && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
                    onClick={() => setEnlargedImage(null)}
                  >
                    <img
                      src={enlargedImage}
                      alt="Enlarged"
                      className="max-w-3xl max-h-3xl rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-row justify-between mt-4">
              <div></div>

              <div className="">
                <a
                  href="https://teams.live.com/l/invite/FBAqqdXZ83gf2rkvQI"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="./microsoft-teams.png"
                    className="w-[40px] h-[40px]"
                  ></img>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

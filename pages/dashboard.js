"use client";
import { motion } from "framer-motion";
import { LuClipboard } from "react-icons/lu";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import ClipLoader from "react-spinners/ClipLoader"; // ✅ Import Spinner
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import DashboardHeader from "@/components/DashboardHeader";

import {
  RefreshCw,
  Filter,
  Trash,
  CheckSquare,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import supabase from "@/lib/supabaseClient";

export default function Dashboard() {
  const { user } = useUser(); // Get logged-in user data
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Track loading state
  const { issue_id } = router.query; // Get issue ID from URL query
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // Stores the selected file
  const [imagePreview, setImagePreview] = useState(null); // Preview before upload
  const [enlargedImage, setEnlargedImage] = useState(null); // Image for popup

  const [selectedTickets, setSelectedTickets] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "updated_at",
    direction: "desc",
  }); // Default sorting

  const [searchParams, setSearchParams] = useState({
    status: "All",
  });
  const [refreshTimer, setRefreshTimer] = useState(300);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closeSubReason, setCloseSubReason] = useState("");
  const [closeMessage, setCloseMessage] = useState("");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [updatedPriority, setUpdatedPriority] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (issue_id) {
      setSearchQuery(issue_id); // Pre-fill the search field
      loadExistingTicket(issue_id); // Auto-load the ticket
    }
  }, [issue_id]); // Runs when the issue_id is present

  async function loadExistingTicket(issue_id) {
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
      setIsExistingTicketLoaded(true);
      toast.success("✅ Ticket loaded successfully!");
    }
  }

  // Handle image selection
  function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Show preview before upload
    }
  }

  function sortTickets(tickets) {
    const { key, direction } = sortConfig;
    return [...tickets].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  function handleSort(column) {
    setSortConfig((prev) => ({
      key: column,
      direction:
        prev.key === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  async function handleCloseTicket() {
    if (!selectedTicket) return;
    const localTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    // Step 1: Add a comment that the ticket was closed
    const closeComment = `Ticket closed. Reason: ${closeReason}. Sub-Reason: ${closeSubReason}. Message: ${closeMessage}`;

    const { error: commentError } = await supabase.from("comments").insert({
      ticket_id: selectedTicket.id,
      text: closeComment,
      commenter_name: "System",
      created_at: localTimestamp,
    });

    if (commentError) {
      console.error("Error adding close comment:", commentError);
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Closed",
        closed_reason: closeReason,
        closed_subreason: closeSubReason,
        closed_message: closeMessage,
        updated_at: new Date().toLocaleString(), // Update timestamp
      })
      .eq("id", selectedTicket.id);

    if (!error) {
      toast.success("✅ Ticket closed successfully!");
      // Step 3: Fetch updated comments
      await fetchComments(selectedTicket.id);

      // Step 4: Send an email notification
      const surveyLink = `${process.env.NEXT_PUBLIC_APP_URL}/survey?ticket_id=${selectedTicket.id}`;

      const emailHtml = `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #007bff;">🎟️ Fetch Ticket Update - Ticket Closed</h2>
    <p>Hi <strong>${selectedTicket.name}</strong>,</p>
    <p>Your support ticket has been closed. Below are the details:</p>
    <hr>
    <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
    <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
    <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
    <p><strong>Status:</strong> Closed</p>
    <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
    <p><strong>Area:</strong> ${selectedTicket.area}</p>
    <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
    <hr>
    <h3>🔒 Closure Details</h3>
    <p><strong>Reason:</strong> ${closeReason}</p>
    <p><strong>Sub-Reason:</strong> ${closeSubReason}</p>
    <p><strong>Additional Notes:</strong> ${closeMessage}</p>

    <hr>
    <h3>📢 We'd Love Your Feedback!</h3>
    <p>Help us improve by taking a quick survey about your experience:</p>
    <a href="${surveyLink}" target="_blank">
      <button style="background-color: #28a745; color: white; padding: 10px 20px;
                    border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
        📝 Take the Survey
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
          to: selectedTicket.email,
          subject: `Your Support Ticket (#${selectedTicket.issue_id}) - Fetch Ticket System *Closed*`,
          html: emailHtml,
        }),
      });

      const emailResult = await emailResponse.json();
      console.log("📨 Email Result:", emailResult);

      if (!emailResult.success) {
        console.error("❌ Email sending failed:", emailResult.error);
      }

      // Step 5: Refresh the ticket list & UI

      fetchTickets(); // Refresh ticket list
      setShowClosePopup(false); // Close popup
      closeTicketDetails(); // Close details view
    } else {
      console.error("Error closing ticket:", error);
      toast.error("❌ Error closing ticket. Please try again.");
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

  const copyToClipboard = (label, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label); // Show feedback for this field

    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { theme } = useTheme();

  // Handle Escape Key to Close Popup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeTicketDetails();
      }
    };

    // Attach event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      setRefreshTimer((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshTimer === 0) fetchTickets();
  }, [refreshTimer]);

  async function fetchComments(ticketId) {
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

  function getFilteredTickets() {
    return sortTickets(
      tickets
        .filter((ticket) => {
          if (searchParams.status === "All") return true;
          if (searchParams.status === "New")
            return ticket.status === "New Request";
          if (searchParams.status === "Open")
            return (
              ticket.status !== "Closed" && ticket.status !== "Canceled by User"
            );
          if (searchParams.status === "Closed")
            return ticket.status === "Closed";
          return true;
        })
        .filter((ticket) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            ticket.issue_id.toLowerCase().includes(query) ||
            ticket.tool_id.toLowerCase().includes(query) ||
            ticket.wiings_order.toLowerCase().includes(query) ||
            ticket.problem_statement.toLowerCase().includes(query) ||
            ticket.status.toLowerCase().includes(query) ||
            ticket.priority.toLowerCase().includes(query)
          );
        })
    );
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case "Low":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Medium":
        return "bg-yellow-500 text-black rounded-lg px-2 py-1";
      case "High":
        return "bg-orange-500 text-white rounded-lg px-2 py-1";
      case "Factory Constraint":
        return "bg-red-500 text-white rounded-lg px-2 py-1";
      default:
        return "bg-gray-300 text-black rounded-lg px-2 py-1";
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "In Progress":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "New Request":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "OM Escalated":
        return "bg-blue-500 text-white rounded-lg px-5 py-1";
      case "Waiting 3PL":
        return "bg-red-500 text-white rounded-lg px-5 py-1";
      case "Canceled by User":
        return "bg-gray-500 text-white rounded-lg px-5 py-1";
      case "Waiting Customer":
        return "bg-orange-500 text-white rounded-lg px-5 py-1";
      case "Waiting Elevator Repair":
        return "bg-purple-500 text-white rounded-lg px-5 py-1";
      case "Waiting Chemicals":
        return "bg-teal-500 text-white rounded-lg px-5 py-1";
      case "Waiting on IT":
        return "bg-pink-500 text-white rounded-lg px-5 py-1";
      case "Waiting Tool Move":
        return "bg-indigo-500 text-white rounded-lg px-5 py-1";
      case "Exceptions/Variants":
        return "bg-lime-500 text-black rounded-lg px-5 py-1";
      case "Waiting Count n Verify":
        return "bg-cyan-500 text-black rounded-lg px-5 py-1";
      case "Waiting Delivery Confirmation":
        return "bg-rose-500 text-white rounded-lg px-5 py-1";
      case "Waiting Distribution":
        return "bg-emerald-500 text-white rounded-lg px-5 py-1";
      case "Waiting Inbound":
        return "bg-fuchsia-500 text-white rounded-lg px-5 py-1";
      case "Waiting IMO":
        return "bg-amber-500 text-black rounded-lg px-5 py-1";
      case "Waiting Inv Control":
        return "bg-violet-500 text-white rounded-lg px-5 py-1";
      case "Waiting Put-away":
        return "bg-sky-500 text-black rounded-lg px-5 py-1";
      case "Waiting Returns":
        return "bg-green-600 text-white rounded-lg px-5 py-1";
      case "Waiting Shipping":
        return "bg-red-600 text-white rounded-lg px-5 py-1";
      case "Waiting Si":
        return "bg-yellow-600 text-black rounded-lg px-5 py-1";
      case "Waiting Stores":
        return "bg-gray-600 text-white rounded-lg px-5 py-1";
      case "Waiting eParts":
        return "bg-blue-600 text-white rounded-lg px-5 py-1";
      case "Re-Opened":
        return "bg-yellow-500 text-black rounded-lg px-5 py-1";
      case "Closed":
        return "bg-red-500 text-white rounded-lg px-5 py-1";
      case "Waiting Buyer/Supplier":
        return "bg-red-500 animate-pulse text-white rounded-lg px-5 py-1";
      default:
        return "bg-gray-300 text-black rounded-lg px-5 py-1";
    }
  }

  function openTicketDetails(ticket) {
    setSelectedTicket(ticket);
    setUpdatedStatus(ticket.status); // Set default status selection
    setUpdatedPriority(ticket.priority); // Set default priority selection
    fetchComments(ticket.id);
  }

  function closeTicketDetails() {
    setSelectedTicket(null);
  }

  // Add comment (handles both text & image)
  async function addComment() {
    if (!newComment.trim() && !selectedImage) return;

    const commenterName = user ? user.fullName : "Customer Service Rep"; // Fallback name
    let imageUrl = null;

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    const localTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });

    // Insert comment
    const { error: commentError } = await supabase.from("comments").insert({
      ticket_id: selectedTicket.id,
      text: newComment,
      commenter_name: commenterName,
      image_url: imageUrl,
      created_at: localTimestamp, // ✅ Store local timestamp
    });

    if (commentError) {
      console.error("Error adding comment:", commentError);
      return;
    }

    // Update the ticket's last updated time
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        updated_at: localTimestamp, // ✅ Update ticket last updated time
      })
      .eq("id", selectedTicket.id);

    if (updateError) {
      console.error("Error updating ticket timestamp:", updateError);
    }

    // 🔥 Fetch fresh comments **AFTER** inserting new comment
    await fetchComments(selectedTicket.id);

    // 💡 Get fresh comments **IMMEDIATELY** after fetchComments
    let { data: latestComments, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("ticket_id", selectedTicket.id)
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
        <p>Hi <strong>${selectedTicket.name}</strong>,</p>
        <p>Your support ticket has received a new comment. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
        <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
        <p><strong>Status:</strong> ${selectedTicket.status}</p>
        <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
        <p><strong>Area:</strong> ${selectedTicket.area}</p>
        <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
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
        <a href="http://${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${selectedTicket.issue_id}" target="_blank" rel="noopener noreferrer">
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
        to: selectedTicket.email,
        subject: `Your Support Ticket (#${selectedTicket.issue_id}) - Fetch Ticket System *New Comment*`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("📨 Email Result:", emailResult);

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error);
    }

    fetchComments(selectedTicket.id);
    fetchTickets(); // Refresh ticket list

    setNewComment("");
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function fetchTickets() {
    setLoading(true); // Start loading
    let { data, error } = await supabase.from("tickets").select("*");
    if (!error) {
      setTickets(data);
    } else {
      console.error("Error fetching tickets:", error);
    }
    setLoading(false); // Stop loading
  }

  useEffect(() => {
    console.log("Updated searchParams.status:", searchParams.status);
  }, [searchParams]);

  function resetHeader() {
    setSearchQuery(""); // Reset search input

    fetchTickets(); // Refresh the ticket list
  }

  async function updateTicket() {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from("tickets")
      .update({
        status: updatedStatus,
        priority: updatedPriority,
        updated_at: new Date().toLocaleString(),
      })
      .eq("id", selectedTicket.id);

    if (!error) {
      // add a new comment if status is updated
      // add a new comment if status or priority is updated
      if (
        updatedStatus !== selectedTicket.status ||
        updatedPriority !== selectedTicket.priority
      ) {
        const commenterName = user ? user.fullName : "Customer Service Rep"; // Fallback name
        const localTimestamp = new Date().toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
        });

        let commentText = "";
        if (updatedStatus !== selectedTicket.status) {
          commentText += `Status updated to ${updatedStatus}. `;
        }
        if (updatedPriority !== selectedTicket.priority) {
          commentText += `Priority changed to ${updatedPriority}. `;
        }

        const { error: commentError } = await supabase.from("comments").insert({
          ticket_id: selectedTicket.id,
          text: commentText.trim(), // Ensures proper formatting
          commenter_name: commenterName,
          created_at: localTimestamp,
        });

        if (commentError) {
          console.error(
            "Error adding comment for status/priority change:",
            commentError
          );
        }
      }

      // email notification
      // 🔥 Fetch fresh comments **AFTER** inserting new comment
      await fetchComments(selectedTicket.id);

      // 💡 Get fresh comments **IMMEDIATELY** after fetchComments
      let { data: latestComments, error: fetchError } = await supabase
        .from("comments")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
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
      selectedTicket.status = updatedStatus;
      selectedTicket.priority = updatedPriority;
      const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${selectedTicket.name}</strong>,</p>
        <p>Your support ticket has received a new comment. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
        <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
        <p><strong>Status:</strong> ${selectedTicket.status}</p>
        <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
        <p><strong>Area:</strong> ${selectedTicket.area}</p>
        <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
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
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${selectedTicket.issue_id}" target="_blank" rel="noopener noreferrer">
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
          to: selectedTicket.email,
          subject: `Your Support Ticket (#${selectedTicket.issue_id}) - Fetch Ticket System *Status Update*`,
          html: emailHtml,
        }),
      });

      const emailResult = await emailResponse.json();
      console.log("📨 Email Result:", emailResult);

      if (!emailResult.success) {
        console.error("❌ Email sending failed:", emailResult.error);
      }

      // Fetch the updated ticket details from Supabase
      // Manually update the UI state immediately
      setSelectedTicket((prevTicket) => ({
        ...prevTicket,
        status: updatedStatus,
        priority: updatedPriority,
        updated_at: new Date().toISOString(), // Ensure latest timestamp
      }));
      console.log("selectedTick after changing satus", selectedTicket);

      fetchTickets(); // ✅ Refresh the main dashboard ticket list
    } else {
      console.error("Error updating ticket:", error);
    }
  }

  const copyAllTicketDetails = () => {
    if (!selectedTicket) return;

    const detailsText = `
    Issue ID: ${selectedTicket.issue_id}
    Name: ${selectedTicket.name}
    Problem Statement: ${selectedTicket.problem_statement}
    Tool ID: ${selectedTicket.tool_id}
    Wiings Order: ${selectedTicket.wiings_order}
    IPN: ${selectedTicket.part_number}
    Fab Submitted As: ${selectedTicket.fab_submitted_as}
    Area: ${selectedTicket.area}
    Supplier: ${selectedTicket.supplier}
    Status: ${selectedTicket.status}
    Priority: ${selectedTicket.priority}
    Last Updated: ${new Date(selectedTicket.updated_at).toLocaleString(
      "en-US",
      {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    )}
    `;

    navigator.clipboard.writeText(detailsText.trim());
    toast.success("📋 All ticket details copied!");
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <DashboardHeader />

      {/* Ticket Queue (Fixed Size with Scroll) */}

      <div className="border rounded-lg p-4 shadow-lg max-w-full">
        <div className="overflow-y-auto min-h-[450px] max-h-[450px]">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <ClipLoader color="#007bff" size={50} /> {/* ✅ Show Spinner */}
            </div>
          ) : (
            <Table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                  {[
                    { key: "issue_id", label: "Issue ID" },
                    { key: "name", label: "Name" },
                    { key: "wiings_order", label: "Order #" },
                    { key: "part_number", label: "Part #" },
                    { key: "tool_id", label: "Tool ID" },
                    { key: "problem_statement", label: "Statement" },
                    { key: "status", label: "Status" },
                    { key: "priority", label: "Priority" },
                    { key: "updated_at", label: "Last Updated" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="p-3 cursor-pointer hover:text-blue-500"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}{" "}
                      {sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? "⬆️"
                          : "⬇️"
                        : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFilteredTickets().length > 0 ? (
                  getFilteredTickets().map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-t hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      <td className="p-3">{ticket.issue_id}</td>
                      <td className="p-3">{ticket.name}</td>
                      <td className="p-3">{ticket.wiings_order}</td>
                      <td className="p-3">{ticket.part_number}</td>
                      <td className="p-3">{ticket.tool_id}</td>
                      <td className="p-3">
                        {ticket.problem_statement.length > 20
                          ? ticket.problem_statement.substring(0, 20) + "..."
                          : ticket.problem_statement}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`${getStatusClass(
                            ticket.status
                          )} p-3 min-w-[200px] whitespace-nowrap inline-block text-center`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`${getPriorityClass(
                            ticket.priority
                          )} p-3 min-w-[100px] whitespace-nowrap inline-block text-center`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      <td className="p-3">
                        <td className="p-3">
                          {ticket.updated_at
                            ? new Date(ticket.updated_at).toLocaleString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false, // Uses 24-hour format, change to `true` for AM/PM format
                                }
                              )
                            : new Date(ticket.created_at).toLocaleString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }
                              )}
                        </td>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan="8">
                      No tickets available
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Ticket Details Popup */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center"
          onClick={closeTicketDetails}
        >
          <div
            className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-6xl w-3/4 min-h-[600px] max-h-[600px] flex gap-8 relative border-gray-300 border-2"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-2xl"
              onClick={closeTicketDetails}
            >
              ✖
            </button>

            {/* Left Side: Ticket Details (Styled) */}
            <div className="w-1/2 flex flex-col">
              <div className="flex flex-row justify-between">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedTicket.issue_id}, {selectedTicket.name}
                </h2>
                <button
                  onClick={copyAllTicketDetails}
                  className="text-gray-600 hover:text-black flex items-center gap-2"
                  title="Copy All Ticket Details"
                >
                  <LuClipboard size={24} />
                  <span className="text-sm font-semibold text-gray-400">
                    Copy All
                  </span>
                </button>
              </div>

              {/* Ticket Information */}
              <div className="flex flex-col bg-gray-100 p-4 rounded text-black min-h-[250px] max-h-[400px] overflow-y-auto">
                {[
                  {
                    label: "Problem Statement",
                    value: selectedTicket.problem_statement,
                  },
                  { label: "Tool ID", value: selectedTicket.tool_id },
                  { label: "Wiings Order", value: selectedTicket.wiings_order },
                  { label: "IPN", value: selectedTicket.part_number },
                  {
                    label: "Fab Submitted As",
                    value: selectedTicket.fab_submitted_as,
                  },
                  { label: "Area", value: selectedTicket.area },
                  { label: "Supplier", value: selectedTicket.supplier },
                  { label: "SPN", value: selectedTicket.wiings_order },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 mb-2 rounded-lg ${
                      index % 2 === 0 ? "bg-gray-200" : "bg-gray-300"
                    }`}
                  >
                    {/* Label (Bold) */}
                    <p className="text-sm text-gray-600 font-semibold">
                      {item.label}:
                    </p>
                    <div className="flex flex-row justify-between">
                      {/* Value (Bigger, More Readable) */}
                      <p className="text-lg font-medium text-black">
                        {item.value}
                      </p>
                      {/* Copy Icon */}
                      <button
                        onClick={() => copyToClipboard(item.label, item.value)}
                        className="ml-3 text-gray-600 hover:text-black"
                        title="Copy to Clipboard"
                      >
                        {copiedField === item.label ? (
                          "✅"
                        ) : (
                          <LuClipboard size={20} />
                        )}
                      </button>
                    </div>

                    {/* Divider */}
                    {index < 5 && <hr className="mt-2 border-gray-400" />}
                  </div>
                ))}
              </div>

              {/* Status & Priority Dropdowns */}
              <div className="mt-4">
                <p className="text-md font-bold mb-2">Update Status:</p>
                <select
                  className="border p-2 rounded w-full text-black"
                  value={updatedStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setUpdatedStatus(newStatus);

                    // Open close ticket popup if "Closed" is selected
                    if (newStatus === "Closed") {
                      setShowClosePopup(true);
                    }
                  }}
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
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <p className="text-md font-bold mb-2">Update Priority:</p>
                <select
                  className="border p-2 rounded w-full text-black"
                  value={updatedPriority}
                  onChange={(e) => setUpdatedPriority(e.target.value)}
                >
                  {["High", "Low", "Medium", "Factory Constraint"].map(
                    (priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Update Ticket Button */}
              <div className="flex justify-end mt-4">
                <Button variant="primary" onClick={updateTicket}>
                  Update Ticket
                </Button>
              </div>
            </div>

            {/* Right Side: Comments Section */}
            <div className="w-1/2 flex flex-col">
              <h3 className="text-2xl font-bold mb-4 text-gray-300">
                Comments
              </h3>

              {/* Comment Thread (Scrollable) */}
              <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded text-black min-h-[250px] max-h-[400px]">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClosePopup && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4 text-gray-200">
              Close Ticket
            </h2>

            {/* Reason Dropdown */}
            <label className="text-gray-100 font-semibold">Reason</label>
            <select
              className="border p-2 rounded w-full text-gray-600 mb-3"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="Resolved">Resolved</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Customer Canceled">Customer Canceled</option>
              <option value="Invalid Request">Invalid Request</option>
              <option value="Other">Other</option>
            </select>

            {/* Sub-Reason Dropdown */}
            <label className="text-gray-100 font-semibold">Sub-Reason</label>
            <select
              className="border p-2 rounded w-full text-black mb-3"
              value={closeSubReason}
              onChange={(e) => setCloseSubReason(e.target.value)}
            >
              <option value="" className="">
                Select a sub-reason
              </option>
              <option value="Issue Fixed">Issue Fixed</option>
              <option value="Customer No Response">Customer No Response</option>
              <option value="Wrong Ticket">Wrong Ticket</option>
              <option value="Other">Other</option>
            </select>

            {/* Additional Message */}
            <label className="text-gray-100 font-semibold">
              Additional Notes
            </label>
            <textarea
              className="w-full p-2 border rounded text-black min-h-[100px] mb-4"
              placeholder="Provide more details..."
              value={closeMessage}
              onChange={(e) => setCloseMessage(e.target.value)}
            ></textarea>

            {/* Submit & Cancel Buttons */}
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowClosePopup(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCloseTicket}>
                Close Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <p className="text-gray-500 mr-2">
            Auto-refresh in {refreshTimer} sec
          </p>
          <Button
            onClick={() => {
              setRefreshTimer(300);
              fetchTickets();
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2 text-black">
          <Select
            className="text-black"
            options={["All", "New", "Open", "Closed"]}
            value={searchParams.status} // ✅ Now properly controlled
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, status: e.target.value }))
            } // ✅ Updates correctly
          />

          {/* Search Input */}
          <input
            type="text"
            placeholder="Filter tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-lg text-black"
          />

          <Button onClick={resetHeader}>
            <RefreshCw className="w-5 h-5 " />
          </Button>
        </div>
      </div>
    </div>
  );
}

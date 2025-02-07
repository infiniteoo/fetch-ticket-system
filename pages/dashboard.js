"use client";
import { LuClipboard } from "react-icons/lu";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
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
  const [tickets, setTickets] = useState([]);
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
      alert("Ticket closed successfully!");
      fetchTickets(); // Refresh tickets
      setShowClosePopup(false); // Close popup
      closeTicketDetails(); // Close details view
    } else {
      console.error("Error closing ticket:", error);
      alert("Error closing ticket. Please try again.");
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

  // Function to filter tickets based on dropdown selection
  /*  function getFilteredTickets() {
    return tickets
      .filter((ticket) => {
        // Dropdown filtering (Status)
        if (searchParams.status === "All") return true;
        if (searchParams.status === "New")
          return ticket.status === "New Request";
        if (searchParams.status === "Open")
          return (
            ticket.status !== "Closed" && ticket.status !== "Canceled by User"
          );
        if (searchParams.status === "Closed") return ticket.status === "Closed";
        return true;
      })
      .filter((ticket) => {
        // Search Box Filtering (Filters across multiple fields)
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
      });
  }
 */

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
  function resetFilteredTickets() {
    return tickets.filter((ticket) => {
      setSearchParams("All");
      if (searchParams.status === "All") return true;
    });
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case "Low":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Medium":
        return "bg-yellow-500 text-black rounded-lg px-2 py-1";
      case "High":
        return "bg-red-500 text-white rounded-lg px-2 py-1";
      case "Factory Constraint":
        return "bg-red-500 animate-pulse text-white rounded-lg px-2 py-1";
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
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting 3PL":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Canceled by User":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Customer":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Elevator Repair":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Chemicals":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting on IT":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Tool Move":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Exceptions/Variants":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Count n Verify":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Delivery Confirmation":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Distribution":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Inbound":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting IMO":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Inv Control":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Put-away":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Returns":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Shipping":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Si":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting Stores":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
      case "Waiting eParts":
        return "bg-green-500 text-white rounded-lg px-5 py-1";
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

    const commenterName = "Customer Service Rep";
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

    fetchComments(selectedTicket.id);
    fetchTickets(); // Refresh ticket list

    setNewComment("");
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function fetchTickets() {
    let { data, error } = await supabase.from("tickets").select("*");
    if (!error) {
      setTickets(data);
    } else {
      console.error("Error fetching tickets:", error);
    }
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
      fetchTickets(); // Refresh tickets in the dashboard
      closeTicketDetails(); // Close popup after updating
    } else {
      console.error("Error updating ticket:", error);
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fetch Ticket System 🎟️</h1>
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
            <RefreshCw className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>

      {/* Ticket Queue (Fixed Size with Scroll) */}
      <div className="border rounded-lg p-4 shadow-lg max-w-full">
        <div className="overflow-y-auto min-h-[400px] max-h-[600px]">
          <Table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                {[
                  { key: "issue_id", label: "Issue ID" },
                  { key: "name", label: "Name" },
                  { key: "wiings_order", label: "Order #" },
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
                    className="border-t hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => openTicketDetails(ticket)}
                  >
                    <td className="p-3">{ticket.issue_id}</td>
                    <td className="p-3">{ticket.name}</td>
                    <td className="p-3">{ticket.wiings_order}</td>
                    <td className="p-3">{ticket.tool_id}</td>
                    <td className="p-3">
                      {ticket.problem_statement.length > 20
                        ? ticket.problem_statement.substring(0, 20) + "..."
                        : ticket.problem_statement}
                    </td>
                    <td className="p-3">
                      <span className={getStatusClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={getPriorityClass(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      {ticket.updated_at
                        ? new Date(ticket.updated_at).toLocaleString()
                        : new Date(ticket.created_at).toLocaleString()}
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
        </div>
      </div>

      {/* Ticket Details Popup */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
          onClick={closeTicketDetails}
        >
          <div
            className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-6xl w-3/4 min-h-[600px] max-h-[600px] flex gap-8 relative"
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
              <h2 className="text-2xl font-bold mb-4">
                {selectedTicket.issue_id}, {selectedTicket.name}
              </h2>

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
              <h3 className="text-2xl font-bold mb-4">Comments</h3>

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
            <h2 className="text-xl font-bold mb-4 text-black">Close Ticket</h2>

            {/* Reason Dropdown */}
            <label className="text-black font-semibold">Reason</label>
            <select
              className="border p-2 rounded w-full text-black mb-3"
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
            <label className="text-black font-semibold">Sub-Reason</label>
            <select
              className="border p-2 rounded w-full text-black mb-3"
              value={closeSubReason}
              onChange={(e) => setCloseSubReason(e.target.value)}
            >
              <option value="">Select a sub-reason</option>
              <option value="Issue Fixed">Issue Fixed</option>
              <option value="Customer No Response">Customer No Response</option>
              <option value="Wrong Ticket">Wrong Ticket</option>
              <option value="Other">Other</option>
            </select>

            {/* Additional Message */}
            <label className="text-black font-semibold">Additional Notes</label>
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
      </div>
    </div>
  );
}

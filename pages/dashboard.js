"use client";

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
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [searchParams, setSearchParams] = useState({
    status: "All",
    priority: "All",
  });
  const [refreshTimer, setRefreshTimer] = useState(300);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [updatedPriority, setUpdatedPriority] = useState("");

  const { theme } = useTheme();

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
      .select("*")
      .eq("ticket_id", ticketId);
    if (!error) setComments(data);
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
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "New Request":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "OM Escalated":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting 3PL":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Canceled by User":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Customer":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Elevator Repair":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Chemicals":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting on IT":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Tool Move":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Exceptions/Variants":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Count n Verify":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Delivery Confirmation":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Distribution":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Inbound":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting IMO":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Inv Control":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Put-away":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Returns":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Shipping":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Si":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting Stores":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Waiting eParts":
        return "bg-green-500 text-white rounded-lg px-2 py-1";
      case "Re-Opened":
        return "bg-yellow-500 text-black rounded-lg px-2 py-1";
      case "Closed":
        return "bg-red-500 text-white rounded-lg px-2 py-1";
      case "Waiting Buyer/Supplier":
        return "bg-red-500 animate-pulse text-white rounded-lg px-2 py-1";
      default:
        return "bg-gray-300 text-black rounded-lg px-2 py-1";
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

  async function addComment() {
    if (!newComment.trim() || !selectedTicket) return;

    const { error } = await supabase.from("comments").insert({
      ticket_id: selectedTicket.id,
      text: newComment,
      created_at: new Date().toISOString(),
    });

    if (!error) {
      setComments([
        ...comments,
        { text: newComment, created_at: new Date().toISOString() },
      ]);
      setNewComment("");
    }
  }

  async function fetchTickets() {
    let { data, error } = await supabase.from("tickets").select("*");
    if (!error) {
      setTickets(data);
    } else {
      console.error("Error fetching tickets:", error);
    }
  }

  async function updateTicket() {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from("tickets")
      .update({
        status: updatedStatus,
        priority: updatedPriority,
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
        <h1 className="text-2xl font-bold">Fetch Ticket System</h1>
        <div className="flex gap-2 text-black">
          <Select
            className="text-black"
            options={["All", "New", "Open", "Closed"]}
            onChange={(e) =>
              setSearchParams({ ...searchParams, status: e.target.value })
            }
          />
          <Select
            className="text-black"
            options={["All", "High", "Medium", "Low"]}
            onChange={(e) =>
              setSearchParams({ ...searchParams, priority: e.target.value })
            }
          />
          <Button onClick={fetchTickets}>
            <RefreshCw className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>

      <Table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-left">
            {/* <th className="p-3">Select</th> */}
            <th className="p-3">Issue ID</th>
            <th className="p-3">Tool ID</th>
            <th className="p-3">Order #</th>
            <th className="p-3">Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-t hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => openTicketDetails(ticket)}
            >
              {/*   <td className="p-3 text-center">
                <Checkbox
                  checked={selectedTickets.includes(ticket.id)}
                  onChange={() => handleSelect(ticket.id)}
                />
              </td> */}
              <td className="p-3">{ticket.issue_id}</td>
              <td className="p-3">{ticket.tool_id}</td>
              <td className="p-3">{ticket.wiings_order}</td>
              <td className="p-3">{ticket.problem_statement}</td>

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
                {new Date(ticket.updated_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Ticket Details Popup */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
          onClick={closeTicketDetails}
        >
          <div
            className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-6xl w-3/4 min-h-[600px] flex gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side: Ticket Details */}
            <div className="w-1/2">
              <h2 className="text-3xl font-bold mb-6">Ticket Details</h2>
              <p className="text-lg mb-4">
                <strong>Issue ID:</strong> {selectedTicket.issue_id}
              </p>
              <p className="text-lg mb-4">
                <strong>Tool ID:</strong> {selectedTicket.tool_id}
              </p>
              <p className="text-lg mb-4">
                <strong>Order #:</strong> {selectedTicket.order_number}
              </p>
              <p className="text-lg mb-4">
                <strong>Title:</strong> {selectedTicket.title}
              </p>
              {/* Status Dropdown */}
              <p className="text-lg mb-4">
                <strong>Status:</strong>{" "}
                <select
                  className="border p-2 rounded text-black"
                  value={updatedStatus}
                  onChange={(e) => setUpdatedStatus(e.target.value)}
                >
                  {[
                    "New Request",
                    "In Progress",
                    "Closed",
                    "Waiting Buyer/Supplier",
                    "Re-Opened",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </p>

              {/* Priority Dropdown */}
              <p className="text-lg mb-4">
                <strong>Priority:</strong>{" "}
                <select
                  className="border p-2 rounded text-black"
                  value={updatedPriority}
                  onChange={(e) => setUpdatedPriority(e.target.value)}
                >
                  {["High", "Medium", "Low", "Factory Constraint"].map(
                    (priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </p>
              <Button variant="primary" onClick={updateTicket} className="mt-4">
                Update Ticket
              </Button>
            </div>

            {/* Right Side: Comments Section */}
            <div className="w-1/2 flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Comments</h3>
              <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded text-black min-h-[200px]">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <p key={index} className="text-black mb-2">
                      <strong>
                        {new Date(comment.created_at).toLocaleString()}:
                      </strong>{" "}
                      {comment.text}
                    </p>
                  ))
                ) : (
                  <p className="text-black">No comments yet</p>
                )}
              </div>

              {/* Comment Input */}
              <div className="mt-4">
                <textarea
                  className="w-full p-3 border rounded text-black min-h-[120px]"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
              </div>

              {/* Comment Actions */}
              <div className="flex justify-end mt-4">
                <Button variant="primary" onClick={addComment}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <p className="text-gray-500 mr-4">
            Auto-refresh in {refreshTimer} sec
          </p>
          <Button
            onClick={() => {
              setRefreshTimer(300);
              fetchTickets();
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

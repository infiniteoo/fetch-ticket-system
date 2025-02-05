import { useState } from "react";
import axios from "axios";

export default function UpdateTicket() {
  const [issueId, setIssueId] = useState("");
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [commenter, setCommenter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");

  // Fetch ticket details
  const fetchTicket = async () => {
    setLoading(true);
    setError("");
    setMessage(null);
    try {
      const { data } = await axios.get(`/api/get-ticket?issue_id=${issueId}`);
      setTicket(data);
      setStatus(data.status);
    } catch (err) {
      setError("Ticket not found. Please check the Issue ID.");
      setTicket(null);
    }
    setLoading(false);
  };

  // Update ticket details
  const updateTicket = async () => {
    setLoading(true);
    setError("");
    setMessage(null);
    try {
      await axios.post("/api/update-ticket", {
        issue_id: issueId,
        status,
        comment,
        commenter,
      });
      setComment("");
      setMessage("Ticket updated successfully!");
      fetchTicket(); // Refresh ticket details
    } catch (err) {
      setError("Failed to update ticket.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 transition-all duration-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Update Your Ticket
      </h2>

      {/* Issue ID Input */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-gray-700">
          Enter Issue ID:
        </label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={issueId}
          onChange={(e) => setIssueId(e.target.value)}
          placeholder="E.g. TICKET-12345"
        />
        <button
          className="mt-3 bg-blue-600 text-white p-3 rounded-lg w-full font-semibold hover:bg-blue-700 transition-all"
          onClick={fetchTicket}
          disabled={loading}
        >
          {loading ? "Loading..." : "Find Ticket"}
        </button>
      </div>

      {/* Display Ticket Information */}
      {ticket && (
        <div className="mt-6 p-6 border rounded-lg bg-gray-100 shadow-inner">
          <p className="text-lg font-semibold text-gray-800">
            <strong>Issue ID:</strong> {ticket.issue_id}
          </p>
          <p className="text-gray-700">
            <strong>Submitter:</strong> {ticket.name}
          </p>
          <p className="text-gray-700">
            <strong>Problem:</strong> {ticket.problem_statement}
          </p>

          {/* Status Dropdown */}
          <div className="mt-5">
            <label className="block font-semibold text-gray-700">
              Update Status:
            </label>
            <select
              className="w-full p-3 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="New Request">New Request</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
              <option value="Waiting Customer">Waiting Customer</option>
              <option value="Waiting on IT">Waiting on IT</option>
            </select>
          </div>

          {/* Comment Input */}
          <div className="mt-5">
            <label className="block font-semibold text-gray-700">
              Your Name:
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={commenter}
              onChange={(e) => setCommenter(e.target.value)}
              placeholder="E.g. John Doe"
            />
          </div>

          <div className="mt-3">
            <label className="block font-semibold text-gray-700">
              Add a Comment:
            </label>
            <textarea
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe any updates..."
            />
          </div>

          {/* Submit Button */}
          <button
            className="mt-5 bg-green-600 text-white p-3 rounded-lg w-full font-semibold hover:bg-green-700 transition-all"
            onClick={updateTicket}
            disabled={loading}
          >
            {loading ? "Updating..." : "Submit Update"}
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <p className="mt-5 text-green-600 text-center font-semibold">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-5 text-red-600 text-center font-semibold">{error}</p>
      )}
    </div>
  );
}

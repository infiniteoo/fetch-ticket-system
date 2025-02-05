import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 300000); // Auto-refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async () => {
    let query = supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter) query = query.eq("status", filter);
    if (search) query = query.ilike("issue_id", `%${search}%`);

    const { data, error } = await query;
    if (error) console.error("Error fetching tickets:", error);
    else setTickets(data);
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Support Ticket Dashboard</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Issue ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-1/2"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="New Request">New Request</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
        <button
          onClick={fetchTickets}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Apply
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Issue ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Priority</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-100">
              <td className="border p-2">{ticket.issue_id}</td>
              <td className="border p-2">{ticket.name}</td>
              <td className="border p-2">{ticket.status}</td>
              <td className="border p-2">{ticket.priority}</td>
              <td className="border p-2">
                <a
                  href={`/ticket/${ticket.id}`}
                  className="text-blue-500 hover:underline"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

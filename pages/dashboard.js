"use client";

import { useEffect, useState } from "react";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { Select } from "../components/ui/Select";

import { RefreshCw, Filter, Trash, CheckSquare } from "lucide-react";
import { useTheme } from "next-themes";
import supabase from "../lib/supabaseClient";

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [searchParams, setSearchParams] = useState({
    status: "All",
    priority: "All",
  });
  const [refreshTimer, setRefreshTimer] = useState(300);
  const { theme } = useTheme();

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(
      () => setRefreshTimer((prev) => (prev > 0 ? prev - 1 : 300)),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshTimer === 0) fetchTickets();
  }, [refreshTimer]);

  async function fetchTickets() {
    let { data, error } = await supabase.from("tickets").select("*");
    if (!error) setTickets(data);
  }

  function handleSelect(ticketId) {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  }

  function applyFilters(ticket) {
    const { status, priority } = searchParams;
    return (
      (status === "All" || ticket.status === status) &&
      (priority === "All" || ticket.priority === priority)
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header & Filters */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fetch Ticket System</h1>
        <div className="flex gap-2">
          <Select
            options={["All", "New", "Open", "Closed"]}
            onChange={(e) =>
              setSearchParams({ ...searchParams, status: e.target.value })
            }
          />
          <Select
            options={["All", "High", "Medium", "Low"]}
            onChange={(e) =>
              setSearchParams({ ...searchParams, priority: e.target.value })
            }
          />
          <Button onClick={() => fetchTickets()}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Ticket Table */}
      <Table>
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th>
              <Checkbox />
            </th>
            <th>Issue ID</th>
            <th>Tool ID</th>
            <th>Order #</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.filter(applyFilters).map((ticket) => (
            <tr
              key={ticket.id}
              className="hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              <td>
                <Checkbox
                  checked={selectedTickets.includes(ticket.id)}
                  onChange={() => handleSelect(ticket.id)}
                />
              </td>
              <td>{ticket.issue_id}</td>
              <td>{ticket.tool_id}</td>
              <td>{ticket.order_number}</td>
              <td>{ticket.title}</td>
              <td>{ticket.status}</td>
              <td>{ticket.priority}</td>
              <td>{new Date(ticket.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-gray-500">Auto-refresh in {refreshTimer} sec</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" disabled={selectedTickets.length === 0}>
            <Trash className="w-5 h-5" />
          </Button>
          <Button variant="primary" disabled={selectedTickets.length === 0}>
            <CheckSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

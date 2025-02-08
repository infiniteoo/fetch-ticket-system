"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import supabase from "@/lib/supabaseClient";

export default function DashboardStats() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({
    factoryConstraintOpen: 0,
    totalOpenTickets: 0,
    newTickets: 0,
    past24Hours: 0,
    past7Days: 0,
    factoryPast7Days: 0,
    closed24Hours: 0,
    closed7Days: 0,
    totalTickets: 0,
    avgCloseTime24h: "00:00:00",
    avgCloseTime7d: "00:00:00",
    avgCloseTimeOverall: "00:00:00",
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const now = new Date();
    const past24HoursDate = new Date(now);
    past24HoursDate.setDate(now.getDate() - 1);
    const past7DaysDate = new Date(now);
    past7DaysDate.setDate(now.getDate() - 7);

    let { data: openTickets } = await supabase
      .from("tickets")
      .select("id")
      .neq("status", "Closed");
    let { data: factoryConstraints } = await supabase
      .from("tickets")
      .select("id")
      .eq("priority", "Factory Constraint")
      .neq("status", "Closed");
    let { data: newTickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("status", "New Request");
    let { data: past24Hours } = await supabase
      .from("tickets")
      .select("id")
      .gte("created_at", past24HoursDate.toISOString());
    let { data: past7Days } = await supabase
      .from("tickets")
      .select("id")
      .gte("created_at", past7DaysDate.toISOString());
    let { data: factoryPast7Days } = await supabase
      .from("tickets")
      .select("id")
      .eq("priority", "Factory Constraint")
      .gte("created_at", past7DaysDate.toISOString());
    let { data: closed24Hours } = await supabase
      .from("tickets")
      .select("created_at, updated_at")
      .eq("status", "Closed")
      .gte("updated_at", past24HoursDate.toISOString());
    let { data: closed7Days } = await supabase
      .from("tickets")
      .select("created_at, updated_at")
      .eq("status", "Closed")
      .gte("updated_at", past7DaysDate.toISOString());
    let { data: totalTickets } = await supabase.from("tickets").select("id");
    let { data: closedAllTime } = await supabase
      .from("tickets")
      .select("created_at, updated_at")
      .eq("status", "Closed");

    function calculateAvgCloseTime(data) {
      if (!data || data.length === 0) return "00:00:00";
      const totalTime = data.reduce((acc, ticket) => {
        return (
          acc + (new Date(ticket.updated_at) - new Date(ticket.created_at))
        );
      }, 0);
      const avgTimeMs = totalTime / data.length;
      const hours = Math.floor(avgTimeMs / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((avgTimeMs % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }

    setStats({
      factoryConstraintOpen: factoryConstraints.length,
      totalOpenTickets: openTickets.length,
      newTickets: newTickets.length,
      past24Hours: past24Hours.length,
      past7Days: past7Days.length,
      factoryPast7Days: factoryPast7Days.length,
      closed24Hours: closed24Hours.length,
      closed7Days: closed7Days.length,
      totalTickets: totalTickets.length,
      avgCloseTime24h: calculateAvgCloseTime(closed24Hours),
      avgCloseTime7d: calculateAvgCloseTime(closed7Days),
      avgCloseTimeOverall: calculateAvgCloseTime(closedAllTime),
    });
  }

  return (
    <div className="bg-black text-green-500 p-6 rounded-lg shadow-md border border-gray-100 max-w-6xl mx-auto ">
      <div className="flex items-center justify-between flex-row">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
          >
            <h1 className="text-2xl font-bold text-gray-200">
              Fetch Ticket System 🎟️
            </h1>
          </motion.div>
        </div>
        <div
          className="flex items-center justify-between cursor-pointer rounded"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex space-x-6 text-lg font-bold">
            <div className="flex items-center space-x-2">
              <span className="text-green-300 text-xl">📛</span>
              <span>{stats.factoryConstraintOpen}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-300 text-xl">📂</span>
              <span>{stats.totalOpenTickets}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-300 text-xl">🆕</span>
              <span>{stats.newTickets}</span>
            </div>
          </div>
          <ChevronDown
            className={`transition-transform text-green-300 text-xl ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          <div className="grid grid-cols-3 gap-4 text-center text-xl font-mono">
            {[
              "Total Tickets",
              "Factory Constraint Open",
              "Total Open Tickets",
              "New Tickets",
              "Tickets Open Past 24 Hours",
              "Tickets Open Past 7 Days",
              "Factory Constraints Past 7 Days",
              "Tickets Closed in Last 24 Hours",
              "Tickets Closed in Last 7 Days",
              "Avg Close Time 24h",
              "Avg Close Time 7d",
              "Avg Close Time Overall",
            ].map((label, index) => (
              <div
                key={index}
                className="bg-green-900 p-4 rounded-lg border border-green-400"
              >
                <p className="mt-2 text-2xl">{label}</p>
                <p className="text-3xl font-bold">
                  {Object.values(stats)[index]}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      alert("Error loading ticket");
    } else {
      setForm(data);
      console.log("loaded ticket", form);
      setIsExistingTicketLoaded(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log("Updating ticket:", form);

    const { error } = await supabase
      .from("tickets")
      .update({
        name: form.name,
        problem_statement: form.problem_statement,
        priority: form.priority,
        fab_submitted_as: form.fab_submitted_as,
        tool_id: form.tool_id,
        wiings_order: form.wiings_order,
        part_number: form.part_number,
        status: form.status,
        area: form.area,
        supplier: form.supplier,
        email: form.email,
        updated_at: new Date().toLocaleString(), // ✅ Ensure timestamp is updated
      })
      .eq("id", form.id); // Ensure correct ticket is updated

    if (error) {
      console.error("Error updating ticket:", error);
      alert("Error updating ticket");
    } else {
      alert("Ticket updated successfully!");
      setIsExistingTicketLoaded(false);
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const issue_id = await generateIssueID();
    // change status to New Request when submitting a new ticket
    setForm({ ...form, status: "New Request" });

    const { error } = await supabase
      .from("tickets")
      .insert([{ ...form, issue_id }]);
    if (error) {
      alert("Error submitting ticket");
    } else {
      alert("Ticket submitted successfully!");
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
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-bold mb-4 text-black">
          Submit a Support Ticket 🎟️
        </h1>
        <div>
          <input
            type="text"
            placeholder="Search Tickets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-lg text-black"
          />

          <Button onClick={() => loadExistingTicket(searchQuery)}>
            <Search className="w-5 h-5 " />
          </Button>
        </div>
      </div>
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
              "Non-Factory Operation",
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
              "RP1",
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
  );
}

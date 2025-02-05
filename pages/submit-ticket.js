import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitTicket() {
  const [form, setForm] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const issue_id = await generateIssueID();

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
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Submit a Support Ticket</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name"
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

        <input
          type="text"
          name="fab_submitted_as"
          value={form.fab_submitted_as}
          onChange={handleChange}
          placeholder="Fab Submitted As"
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="tool_id"
          value={form.tool_id}
          onChange={handleChange}
          placeholder="Tool ID"
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="wiings_order"
          value={form.wiings_order}
          onChange={handleChange}
          placeholder="Wiings Order"
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="part_number"
          value={form.part_number}
          onChange={handleChange}
          placeholder="Part Number"
          className="border p-2 rounded"
        />

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

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded col-span-2"
        >
          Submit Ticket
        </button>
      </form>
    </div>
  );
}

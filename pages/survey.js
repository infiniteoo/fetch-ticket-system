"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

export default function Survey() {
  const router = useRouter();
  const { ticket_id } = router.query;
  const [form, setForm] = useState({
    easeOfUse: 3,
    responseTime: 3,
    resolutionQuality: 3,
    overallSatisfaction: 3,
    additionalComments: "",
  });

  useEffect(() => {
    if (!ticket_id) {
      toast.error("Invalid survey link");
    }
  }, [ticket_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ticket_id) return;

    const { error } = await supabase.from("surveys").insert([
      {
        ticket_id,
        ease_of_use: form.easeOfUse,
        response_time: form.responseTime,
        resolution_quality: form.resolutionQuality,
        overall_satisfaction: form.overallSatisfaction,
        comments: form.additionalComments,
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      toast.error("Error submitting survey. Please try again.");
    } else {
      toast.success("Survey submitted successfully!");
      sendSurveySummary(); // Send survey summary email
      router.push("/thank-you"); // Redirect to a thank-you page
    }
  }

  async function sendSurveySummary() {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">📊 Survey Feedback for Ticket #${ticket_id}</h2>
        <p>Below are the responses:</p>
        <hr>
        <p><strong>Ease of Use:</strong> ${form.easeOfUse} / 5</p>
        <p><strong>Response Time:</strong> ${form.responseTime} / 5</p>
        <p><strong>Resolution Quality:</strong> ${
          form.resolutionQuality
        } / 5</p>
        <p><strong>Overall Satisfaction:</strong> ${
          form.overallSatisfaction
        } / 5</p>
        <p><strong>Additional Comments:</strong> ${
          form.additionalComments || "N/A"
        }</p>
        <hr>
        <p>Thank you for your feedback! 🎟️</p>
      </div>
    `;

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "troydorman@gmail.com", // Change to submitter's email in production
        subject: `Survey Results - Ticket #${ticket_id}`,
        html: emailHtml,
      }),
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4 text-gray-500">
        📝 Ticket Survey
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Rate your experience with our support team
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-gray-600">
        {[
          { label: "Ease of Use", key: "easeOfUse" },
          { label: "Response Time", key: "responseTime" },
          { label: "Resolution Quality", key: "resolutionQuality" },
          { label: "Overall Satisfaction", key: "overallSatisfaction" },
        ].map(({ label, key }) => (
          <div key={key} className="flex flex-col">
            <label className="font-semibold">{label}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={form[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: Number(e.target.value) })
              }
              className="mt-2 w-full"
            />
            <span className="text-center text-sm">{form[key]} / 5</span>
          </div>
        ))}

        <div className="flex flex-col">
          <label className="font-semibold">Additional Comments</label>
          <textarea
            className="border p-2 rounded mt-2"
            placeholder="Tell us more about your experience..."
            value={form.additionalComments}
            onChange={(e) =>
              setForm({ ...form, additionalComments: e.target.value })
            }
          ></textarea>
        </div>

        <Button type="submit" className="w-full">
          Submit Feedback
        </Button>
      </form>
    </div>
  );
}

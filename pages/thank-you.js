"use client";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/Button";

export default function ThankYou() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500">
      <div className="bg-green-900 p-10 rounded-lg shadow-lg text-center border border-green-500">
        <h1 className="text-4xl font-bold mb-4">🎉 Thank You!</h1>
        <p className="text-lg mb-6">
          We appreciate your feedback. Your response has been recorded.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-green-500 text-black px-6 py-3 rounded-lg"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
}

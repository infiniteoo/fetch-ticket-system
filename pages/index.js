import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold">Welcome to Fetch Ticket System 🎟️</h1>
      <p className="text-gray-400 mt-2">
        Submit and manage support tickets efficiently.
      </p>

      <Link href="/submit-ticket" className="m-2">
        <Button variant="primary">Submit a Ticket</Button>
      </Link>
      <Link href="/dashboard">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>

      <p className="mt-5 text-gray-600">
        Discialimer: This website is strictly for demonstration purposes only
        and is in no way affiliated with GXO or Intel in any capacity.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold">Welcome to Fetch Ticket System 🎟️</h1>
      <p className="text-gray-600 mt-2">
        Submit and manage support tickets efficiently.
      </p>
      <a
        href="/dashboard"
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

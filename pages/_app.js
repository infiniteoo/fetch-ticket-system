import "../app/globals.css";
import { Toaster } from "react-hot-toast";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      {/* Navbar Container */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-lg">
        {/* Left Side: App Name (optional) */}
        {/* insert gxo_logo a plus sign and intel_logo */}
        <div className="flex items-center space-x-4">
          <img
            src="/gxo_logo.png"
            alt="gxo_logo"
            className="h-8 w-16 rounded-xl"
          />
        </div>

        {/* Right Side: Clerk Sign-In / User Button */}
        <div className="ml-auto flex items-center space-x-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-500 px-4 py-2 rounded-lg">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Page Content */}
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;

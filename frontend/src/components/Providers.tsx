"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use the env variable, fallback to the one provided in the backend .env if not set
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1082574015610-10rq1j78og6kpsj9hhmk4fai9t2n91b2.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute Wrapper Component
 * 
 * Secures routes by:
 * 1. Showing loading state while auth is being determined
 * 2. Redirecting unauthenticated users to /sign-in
 * 3. Preventing flash of protected content before redirect
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Crucial: Only redirect when loading is complete AND user is null
    if (!loading && !user) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to /sign-in');
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  // Loading State: Prevent dashboard from rendering while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated: Return null to avoid flash of content before redirect
  if (!user) {
    return null;
  }

  // Authenticated: Render protected content
  return <>{children}</>;
}
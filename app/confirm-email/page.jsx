"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useAuth } from "@/contexts/auth-context";

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const { signInWithEmail } = useAuth();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  // Redirect if username is missing & retrieve stored password
  useEffect(() => {
    if (!username) {
      toast.error("Email address is required");
      router.push("/sign-up");
    }
    
    // Check if password was stored from sign-up
    if (typeof window !== 'undefined') {
      const storedPassword = sessionStorage.getItem('pending-signup-password');
      if (storedPassword) {
        setPassword(storedPassword);
        setNeedsPassword(true);
        // Clear it after retrieval for security
        sessionStorage.removeItem('pending-signup-password');
      }
    }
  }, [username, router]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (!username) {
      setError("Email address is missing");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[ConfirmEmail] Confirming sign-up for:", username);
      
      await confirmSignUp({
        username,
        confirmationCode: code,
      });
console.log("[ConfirmEmail] Email confirmed successfully");

      // If password is provided, auto sign-in
      if (password) {
        console.log("[ConfirmEmail] Auto-signing in user...");
        try {
          // Use auth context's signInWithEmail to ensure cookies are set
          await signInWithEmail(username, password);
          
          // Wait a bit for Hub events to fire and cookies to be set
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          toast.success("Email verified! Welcome aboard!");
          router.push("/onboarding");
          return;
        } catch (signInError) {
          console.error("[ConfirmEmail] Auto sign-in failed:", signInError);
          toast.success("Email verified! Please sign in to continue.");
          router.push("/sign-in");
          return;
        }
      }
      
      // No password provided - just redirect to sign-in
      toast.success("Email verified! Please sign in to continue.");
      // Redirect to sign-in page
      router.push("/sign-in");
    } catch (err) {
      console.error("[ConfirmEmail] Confirmation error:", err);
      
      let errorMessage = "Failed to verify code. Please try again.";
      
      if (err.name === "CodeMismatchException") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (err.name === "ExpiredCodeException") {
        errorMessage = "Verification code has expired. Please request a new one.";
      } else if (err.name === "NotAuthorizedException") {
        errorMessage = "User already confirmed or invalid request.";
      } else if (err.name === "LimitExceededException") {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!username) {
      toast.error("Email address is missing");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      console.log("[ConfirmEmail] Resending code to:", username);
      
      await resendSignUpCode({
        username,
      });

      console.log("[ConfirmEmail] Code resent successfully");
      toast.success("Code resent! Check your email.");
    } catch (err) {
      console.error("[ConfirmEmail] Resend error:", err);
      
      let errorMessage = "Failed to resend code. Please try again.";
      
      if (err.name === "LimitExceededException") {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (err.name === "InvalidParameterException") {
        errorMessage = "User already confirmed or invalid request.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Don't render if username is missing
  if (!username) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Pravartak Logo"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification code to
            <br />
            <span className="font-semibold text-foreground">{username}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                autoComplete="off"
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {needsPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <p className="text-xs text-muted-foreground">
                  We'll sign you in automatically after verification
                </p>
              </div>
            )}

            {!needsPassword && (
              <Button
                type="button"
                variant="link"
                onClick={() => setNeedsPassword(true)}
                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                Want to sign in automatically? Add your password
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {password ? "Verifying & Signing In..." : "Verifying..."}
                </>
              ) : (
                password ? "Verify & Sign In" : "Verify Email"
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="text-primary hover:underline p-0 h-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Link
              href="/sign-up"
              className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}

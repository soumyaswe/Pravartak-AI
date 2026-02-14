"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Clear any auth-intent to ensure this is a sign-in flow
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-intent');
      }
      
      console.log('[SignIn] Starting sign-in process...');
      await signInWithEmail(formData.email, formData.password);
      console.log('[SignIn] Sign-in successful');
      
      // Wait for Hub events to fire and cookies to be set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Successfully signed in!");
      
      // Use router.push - Hub listener will handle state updates
      console.log('[SignIn] Redirecting to /dashboard...');
      router.push("/dashboard");
    } catch (error) {
      console.error("Email sign in error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error response:", error.$response);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      // Handle specific Cognito errors
      let errorMessage = "Failed to sign in. Please try again.";
      
      // Check for SECRET_HASH error (App Client has secret configured)
      if (error.message?.includes('SECRET_HASH')) {
        errorMessage = "Configuration Error: Your AWS Cognito App Client is configured with a client secret. " +
          "Please go to AWS Cognito Console and create a new App Client WITHOUT a client secret, " +
          "then update NEXT_PUBLIC_COGNITO_CLIENT_ID in your .env.local file.";
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = "No account found with this email address.";
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = "Please verify your email address first.";
        toast.error(errorMessage);
        // Redirect to confirm email page
        setTimeout(() => {
          router.push(`/confirm-email?username=${encodeURIComponent(formData.email)}`);
        }, 1500);
        return; // Exit early to avoid showing error toast again
      } else if (error.name === 'TooManyRequestsException') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = "Invalid email address format.";
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = "Password does not meet requirements.";
      } else if (error.message?.includes('not configured')) {
        errorMessage = "Authentication service not configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Card className="w-full">
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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue your career journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sign In
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
  );
}

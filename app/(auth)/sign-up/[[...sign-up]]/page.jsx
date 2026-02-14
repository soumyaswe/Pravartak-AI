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

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!formData.email) {
      toast.error("Please enter your email");
      return false;
    }
    if (!formData.password) {
      toast.error("Please enter a password");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    // Cognito password requirements: uppercase, lowercase, and numbers
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      toast.error("Password must contain uppercase, lowercase, and numbers");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('[SignUp] Starting sign-up process...');
      const result = await signUpWithEmail(formData.email, formData.password, formData.name);
      console.log('[SignUp] Sign-up result:', result);
      
      // Check if email confirmation is required
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        console.log('[SignUp] Email confirmation required, redirecting...');
        
        // Store password temporarily for auto sign-in after confirmation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending-signup-password', formData.password);
        }
        
        toast.success("Account created! Please check your email for the verification code.");
        router.push(`/confirm-email?username=${encodeURIComponent(formData.email)}`);
      } else {
        // Auto-confirmed or already signed in
        // Wait for Hub events to fire and cookies to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success("Account created successfully!");
        console.log('[SignUp] Redirecting to /onboarding...');
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      // Handle specific Cognito errors
      let errorMessage = "Failed to create account. Please try again.";
      
      // Check for SECRET_HASH error (App Client has secret configured)
      if (error.message?.includes('SECRET_HASH')) {
        errorMessage = "Configuration Error: Your AWS Cognito App Client is configured with a client secret. " +
          "Please go to AWS Cognito Console and create a new App Client WITHOUT a client secret, " +
          "then update NEXT_PUBLIC_COGNITO_CLIENT_ID in your .env.local file.";
      } else if (error.name === 'UsernameExistsException') {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = "Password must be at least 8 characters with uppercase, lowercase, and numbers.";
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
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Get started with your AI-powered career journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

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
                  placeholder="Min. 8 chars with uppercase, lowercase, numbers"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
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
              Create Account
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
  );
}

import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/resume",
  "/interview", 
  "/ai-cover-letter",
  "/onboarding",
  "/cv-analyser"
];

const authRoutes = ["/sign-in", "/sign-up"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // For protected routes, let the client-side ProtectedRoute component handle the redirect
    // This is because Firebase auth state is only available client-side
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

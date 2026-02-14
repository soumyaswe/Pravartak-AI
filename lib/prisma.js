import { PrismaClient } from "@prisma/client";

// Lazy initialization: Only validate DATABASE_URL when the client is actually created
// This allows the module to be imported during build time without failing
// The validation will happen on first database access at runtime
function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  
  // Use placeholder during build if DATABASE_URL is not available
  // This allows Next.js build to complete successfully
  // At runtime, the actual DATABASE_URL from secrets will be used
  const connectionString = dbUrl || "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
}

// Create or reuse Prisma client instance
// Validation will occur naturally when database operations are attempted
export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

/**
 * Runtime validation helper to check if DATABASE_URL is properly configured
 * Call this before critical database operations if you need explicit validation
 * @throws {Error} If DATABASE_URL is not set or is a placeholder
 */
export function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl || dbUrl.includes("placeholder")) {
    throw new Error(
      "DATABASE_URL is not properly configured. Please ensure it is set in your environment variables or Secret Manager."
    );
  }
}

// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.

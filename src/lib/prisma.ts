// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * Prisma Client Configuration
 * Implements singleton pattern to prevent multiple instances in development
 */

// Extend the global object to include prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma Client with configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

// Use global variable in development to preserve instance
// across hot reloads
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Add middleware for soft deletes (optional)
prisma.$use(async (params, next) => {
  // Soft delete middleware
  if (params.action === "delete") {
    // Change action to update
    params.action = "update";
    params.args["data"] = { deletedAt: new Date() };
  }

  if (params.action === "deleteMany") {
    // Change action to updateMany
    params.action = "updateMany";
    if (params.args.data !== undefined) {
      params.args.data["deletedAt"] = new Date();
    } else {
      params.args["data"] = { deletedAt: new Date() };
    }
  }

  // Exclude soft deleted records from queries
  if (params.action === "findUnique" || params.action === "findFirst") {
    // Change to findFirst
    params.action = "findFirst";
    // Add where clause to exclude deleted records
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    };
  }

  if (params.action === "findMany") {
    // Exclude deleted records
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where["deletedAt"] = null;
      }
    } else {
      params.args["where"] = { deletedAt: null };
    }
  }

  return next(params);
});

/**
 * Supabase Client Configuration
 * Creates both public and admin clients
 */

// Type safety for environment variables
const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Create public Supabase client (uses anon key)
export const supabase = createClient(
  getEnvVariable("NEXT_PUBLIC_SUPABASE_URL"),
  getEnvVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "laos-band",
      },
    },
  }
);

// Create admin Supabase client (uses service role key)
// Only use this on the server side!
export const supabaseAdmin = createClient(
  getEnvVariable("NEXT_PUBLIC_SUPABASE_URL"),
  getEnvVariable("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "laos-band-admin",
      },
    },
  }
);

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Graceful shutdown handling
 */
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Export types for use in other files
export type { PrismaClient } from "@prisma/client";
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

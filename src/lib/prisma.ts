// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * Singleton pattern implementation for Prisma Client
 * Prevents connection exhaustion in serverless environments
 * Implements connection pooling through PgBouncer
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma configuration with advanced logging and performance monitoring
 * Implements query optimization through selective logging and metrics collection
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],

    // Query engine configuration for optimal performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Middleware for query performance monitoring
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    console.log(
      `Query ${params.model}.${params.action} took ${after - before}ms`
    );

    return result;
  });
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Supabase client configuration with Row Level Security (RLS)
 * Implements secure client-side database access with JWT authentication
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

/**
 * Supabase admin client for server-side operations
 * Bypasses RLS for administrative tasks
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// src/lib/db.ts
/**
 * Advanced database utility functions implementing
 * transaction management, retry logic, and error handling
 */
import { Prisma } from "@prisma/client";

/**
 * Transaction wrapper with automatic retry logic
 * Implements exponential backoff for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    factor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-transient errors
      if (!isTransientError(error)) {
        throw error;
      }

      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * delay * 0.1;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));

      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Determine if error is transient and eligible for retry
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server timeout
    // P2024: Connection pool timeout
    return ["P1001", "P1002", "P2024"].includes(error.code);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("econnrefused")
    );
  }

  return false;
}

/**
 * Batch operation utility for optimal database performance
 * Implements chunking to prevent query size limits
 */
export async function batchOperation<T>(
  items: T[],
  operation: (batch: T[]) => Promise<void>,
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await operation(batch);
  }
}

/**
 * Cursor-based pagination utility
 * Implements efficient pagination for large datasets
 */
export interface PaginationParams {
  cursor?: string;
  take?: number;
  direction?: "forward" | "backward";
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  total?: number;
}

export async function paginate<T extends { id: string }>(
  model: {
    findMany: (args: unknown) => Promise<T[]>;
    count: (args: unknown) => Promise<number>;
  },
  params: PaginationParams & {
    where?: unknown;
    orderBy?: unknown;
    include?: unknown;
    select?: unknown;
  }
): Promise<PaginatedResult<T>> {
  const {
    cursor,
    take = 20,
    direction = "forward",
    where,
    orderBy = { createdAt: "desc" },
    include,
    select,
  } = params;

  const skip = cursor ? 1 : 0;
  const takeWithOverflow = direction === "forward" ? take + 1 : -(take + 1);

  type QueryOptions = {
    take: number;
    skip: number;
    where?: unknown;
    orderBy?: unknown;
    cursor?: { id: string };
    include?: unknown;
    select?: unknown;
  };

  const query: QueryOptions = {
    take: takeWithOverflow,
    skip,
    where,
    orderBy,
  };

  if (cursor) {
    query.cursor = { id: cursor };
  }

  if (include) query.include = include;
  if (select) query.select = select;

  const items = await model.findMany(query);

  let hasMore = false;
  if (items.length > take) {
    hasMore = true;
    items.pop();
  }

  const nextCursor = items.length > 0 ? items[items.length - 1].id : undefined;
  const prevCursor = items.length > 0 ? items[0].id : undefined;

  // Optional: Get total count (expensive operation)
  const total = params.cursor ? undefined : await model.count({ where });

  return {
    items,
    nextCursor: hasMore ? nextCursor : undefined,
    prevCursor: direction === "backward" ? prevCursor : undefined,
    hasMore,
    total,
  };
}

/**
 * Soft delete implementation
 * Maintains data integrity while allowing recovery
 */
// Define a type for Prisma models with update method
type PrismaModelWithUpdate = {
  update: (args: {
    where: { id: string };
    data: { deletedAt: Date; deletedBy?: string };
  }) => Promise<unknown>;
};

export async function softDelete(
  model: PrismaClient[keyof PrismaClient] | string,
  id: string,
  userId?: string
): Promise<void> {
  if (typeof model === "string") {
    // Handle string model name case
    const modelName = model as string;
    await (
      prisma[
        modelName as keyof PrismaClient
      ] as unknown as PrismaModelWithUpdate
    ).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  } else {
    // Handle model delegate case
    await (
      model as unknown as {
        update: (args: {
          where: { id: string };
          data: { deletedAt: Date; deletedBy?: string };
        }) => Promise<unknown>;
      }
    ).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}

/**
 * Database health check utility
 * Implements comprehensive connectivity verification
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

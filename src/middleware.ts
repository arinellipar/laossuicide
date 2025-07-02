// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Route configuration matrix defining access control policies
 * Implements a declarative security model with role-based permissions
 */
const ROUTE_CONFIG = {
  // Public routes - no authentication required
  public: [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/verify",
    "/api/auth",
  ],

  // Protected routes - authentication required
  protected: {
    user: ["/dashboard", "/profile", "/orders", "/cart"],
    admin: ["/admin", "/admin/products", "/admin/orders", "/admin/analytics"],
    superAdmin: ["/admin/users", "/admin/settings", "/admin/audit"],
  },

  // API routes with specific permissions
  api: {
    public: ["/api/products", "/api/events"],
    authenticated: ["/api/user", "/api/orders", "/api/cart"],
    admin: ["/api/admin", "/api/analytics"],
  },
} as const;

/**
 * Performance optimization through path matching
 * Implements early termination for static assets
 */
const STATIC_PATHS = [
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/images",
  "/fonts",
];

/**
 * Main middleware function implementing:
 * - Authentication verification
 * - Role-based access control
 * - Performance optimizations
 * - Security headers injection
 * - Request logging for audit trail
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Performance optimization: Skip middleware for static assets
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Clone URL for potential redirects
  const url = request.nextUrl.clone();

  // Initialize response with security headers
  const response = NextResponse.next();

  // Inject security headers for defense in depth
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy with nonce generation
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  response.headers.set(
    "Content-Security-Policy",
    `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' https: data: blob:;
      connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co;
      frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s+/g, " ")
      .trim()
  );

  // Check if route is public
  const isPublicRoute = ROUTE_CONFIG.public.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isPublicAPI = ROUTE_CONFIG.api.public.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute || isPublicAPI) {
    return response;
  }

  // Authenticate user session
  const session = await auth();

  // Handle unauthenticated requests
  if (!session?.user) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Web routes redirect to login
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Extract user role for RBAC
  const userRole = session.user.role;

  // Check admin routes
  if (pathname.startsWith("/admin")) {
    // Super admin routes
    if (
      ROUTE_CONFIG.protected.superAdmin.some((route) =>
        pathname.startsWith(route)
      )
    ) {
      if (userRole !== "SUPER_ADMIN") {
        return handleUnauthorized(pathname, userRole);
      }
    }
    // Regular admin routes
    else if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return handleUnauthorized(pathname, userRole);
    }
  }

  // Check admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  // Log request for audit trail (async, non-blocking)
  logRequest(request, session.user.id, pathname).catch(console.error);

  return response;
}

/**
 * Handle unauthorized access with appropriate response
 */
function handleUnauthorized(pathname: string, userRole: string) {
  // API routes return 403 Forbidden
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Forbidden",
        required_role: pathname.includes("super") ? "SUPER_ADMIN" : "ADMIN",
        current_role: userRole,
      },
      { status: 403 }
    );
  }

  // Web routes redirect to error page
  const url = new URL("/auth/error", process.env.NEXT_PUBLIC_APP_URL!);
  url.searchParams.set("error", "AccessDenied");
  return NextResponse.redirect(url);
}

/**
 * Async request logging for audit trail
 * Implements non-blocking logging to prevent performance degradation
 */
async function logRequest(
  request: NextRequest,
  userId: string,
  pathname: string
) {
  try {
    // Extract relevant headers for logging
    const headers = {
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      referer: request.headers.get("referer"),
    };

    // Use fetch to call internal API to avoid circular dependencies
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action: "PAGE_ACCESS",
        entity: "ROUTE",
        entityId: pathname,
        metadata: headers,
      }),
    });
  } catch (error) {
    // Fail silently to prevent blocking requests
    console.error("Audit log error:", error);
  }
}

/**
 * Middleware configuration
 * Optimized matcher patterns for performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

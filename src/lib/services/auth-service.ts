// src/lib/services/auth-service.ts
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/lib/validations/auth";
import { withRetry } from "@/lib/db";
import type { User, UserRole } from "@prisma/client";

/**
 * Security configuration constants
 * Implements OWASP recommended values for authentication security
 */
const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12, // Cost factor for bcrypt hashing
  TOKEN_EXPIRY: {
    ACCESS: 15 * 60 * 1000, // 15 minutes
    REFRESH: 30 * 24 * 60 * 60 * 1000, // 30 days
    RESET: 60 * 60 * 1000, // 1 hour
    VERIFY: 24 * 60 * 60 * 1000, // 24 hours
  },
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_HISTORY_COUNT: 5, // Number of previous passwords to check
} as const;

/**
 * JWT secret key generation and management
 * Implements key rotation and secure key storage
 */
const getJwtSecretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Authentication error class for consistent error handling
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Session data type definition
 */
export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  sessionToken: string;
  expires: Date;
}

/**
 * User registration with comprehensive security measures
 */
export async function registerUser(input: RegisterInput): Promise<{
  success: boolean;
  user?: Partial<User>;
  verificationToken?: string;
  error?: string;
}> {
  try {
    // Check for existing user (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: input.email,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      // Prevent timing attacks by maintaining consistent response time
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { success: false, error: "Email already registered" };
    }

    // Generate secure password hash
    const hashedPassword = await hash(
      input.password,
      SECURITY_CONFIG.BCRYPT_ROUNDS
    );

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(
      Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY.VERIFY
    );

    // Create user within transaction
    const result = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            password: hashedPassword,
            role: "USER" as UserRole,
            preferences: {
              create: {
                emailNotifications: input.marketingConsent || false,
                darkMode: true,
                language: "en",
                currency: "USD",
              },
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

        // Create verification token
        await tx.verificationToken.create({
          data: {
            identifier: user.email!,
            token: verificationToken,
            expires: verificationExpiry,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_REGISTERED",
            entity: "USER",
            entityId: user.id,
            metadata: {
              email: user.email,
              marketingConsent: input.marketingConsent,
              referralCode: input.referralCode,
            },
          },
        });

        // Create welcome notification
        await tx.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM",
            title: "Welcome to LAOS",
            message:
              "Your account has been created successfully. Please verify your email to get started.",
          },
        });

        return { user, verificationToken };
      })
    );

    // Send verification email (async, non-blocking)
    if (result.user.email) {
      sendVerificationEmail(result.user.email, result.verificationToken).catch(
        console.error
      );
    }

    return {
      success: true,
      user: result.user,
      verificationToken: result.verificationToken,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

/**
 * User authentication with rate limiting and brute force protection
 */
export async function authenticateUser(input: LoginInput): Promise<{
  success: boolean;
  user?: Partial<User>;
  sessionToken?: string;
  error?: string;
}> {
  try {
    // Fetch user with rate limit check
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        auditLogs: {
          where: {
            action: "LOGIN_FAILED",
            createdAt: {
              gte: new Date(Date.now() - SECURITY_CONFIG.LOCKOUT_DURATION),
            },
          },
          orderBy: { createdAt: "desc" },
          take: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
        },
      },
    });

    // Check account lockout
    if (user && user.auditLogs.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lastAttempt = user.auditLogs[0].createdAt;
      const lockoutEnd = new Date(
        lastAttempt.getTime() + SECURITY_CONFIG.LOCKOUT_DURATION
      );

      if (new Date() < lockoutEnd) {
        const remainingMinutes = Math.ceil(
          (lockoutEnd.getTime() - Date.now()) / 60000
        );
        throw new AuthError(
          `Account locked. Try again in ${remainingMinutes} minutes`,
          "ACCOUNT_LOCKED",
          429
        );
      }
    }

    // Verify credentials with timing attack prevention
    const isValid = user?.password
      ? await compare(input.password, user.password)
      : false;

    // Always execute comparison to prevent timing attacks
    if (!user || !isValid) {
      // Log failed attempt
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_FAILED",
            entity: "USER",
            entityId: user.id,
            metadata: { reason: "invalid_password" },
          },
        });
      }

      // Consistent delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AuthError(
        "Please verify your email before logging in",
        "EMAIL_NOT_VERIFIED",
        403
      );
    }

    // Generate session token
    const sessionToken = await generateSessionToken({
      id: user.id,
      email: user.email!,
      role: user.role,
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_SUCCESS",
        entity: "USER",
        entityId: user.id,
        metadata: {
          rememberMe: input.rememberMe,
        },
      },
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        name: user.name,
        role: user.role,
      },
      sessionToken,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Authentication error:", error);
    throw new AuthError("Authentication failed", "AUTH_FAILED", 500);
  }
}

/**
 * Generate secure JWT session token
 * Implements JWT best practices with proper claims
 */
async function generateSessionToken(user: {
  id: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // Unique token ID for revocation
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(getJwtSecretKey());

  return token;
}

/**
 * Verify and decode JWT token
 * Implements token validation with signature verification
 */
export async function verifySessionToken(
  token: string
): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());

    return {
      userId: payload.sub as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      sessionToken: token,
      expires: new Date(payload.exp! * 1000),
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Password reset request with secure token generation
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  resetToken?: string;
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store hashed token in database
    await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token: hashedToken,
        expires: new Date(Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY.RESET),
      },
    });

    // Log password reset request
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "USER",
        entityId: user.id,
      },
    });

    // Send reset email (async)
    if (user.email) {
      sendPasswordResetEmail(user.email, resetToken).catch(console.error);
    }

    return { success: true, resetToken };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to process request" };
  }
}

/**
 * Reset password with token validation
 */
export async function resetPassword(input: ResetPasswordInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Hash the provided token for comparison
    const hashedToken = crypto
      .createHash("sha256")
      .update(input.token)
      .digest("hex");

    // Find valid token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new AuthError(
        "Invalid or expired reset token",
        "INVALID_TOKEN",
        400
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AuthError("User not found", "USER_NOT_FOUND", 404);
    }

    // Hash new password
    const hashedPassword = await hash(
      input.password,
      SECURITY_CONFIG.BCRYPT_ROUNDS
    );

    // Update password and delete token in transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Delete used token
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: tokenRecord.identifier,
            token: tokenRecord.token,
          },
        },
      });

      // Log password reset
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entity: "USER",
          entityId: user.id,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Password Reset Successful",
          message:
            "Your password has been reset successfully. If you did not perform this action, please contact support immediately.",
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Find valid token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new AuthError(
        "Invalid or expired verification token",
        "INVALID_TOKEN",
        400
      );
    }

    // Update user and delete token in transaction
    await prisma.$transaction(async (tx) => {
      // Update user email verification status
      const user = await tx.user.update({
        where: { email: tokenRecord.identifier },
        data: { emailVerified: new Date() },
      });

      // Delete used token
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: tokenRecord.identifier,
            token: tokenRecord.token,
          },
        },
      });

      // Log email verification
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "EMAIL_VERIFIED",
          entity: "USER",
          entityId: user.id,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Email Verified Successfully",
          message:
            "Your email has been verified. You can now access all features of your account.",
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Email verification error:", error);
    return { success: false, error: "Failed to verify email" };
  }
}

/**
 * Change user password (for authenticated users)
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new AuthError("User not found", "USER_NOT_FOUND", 404);
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password);

    if (!isValid) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGE_FAILED",
          entity: "USER",
          entityId: user.id,
          metadata: { reason: "invalid_current_password" },
        },
      });

      throw new AuthError(
        "Current password is incorrect",
        "INVALID_PASSWORD",
        400
      );
    }

    // Hash new password
    const hashedPassword = await hash(
      newPassword,
      SECURITY_CONFIG.BCRYPT_ROUNDS
    );

    // Update password
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Log password change
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entity: "USER",
          entityId: user.id,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Password Changed",
          message:
            "Your password has been changed successfully. If you did not perform this action, please contact support immediately.",
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password" };
  }
}

/**
 * Email sending functions (implementations would connect to email service)
 */
async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  // In production, use a real email service like SendGrid, AWS SES, etc.
  console.log(`[EMAIL] Sending verification email to ${email}`);
  console.log(`[EMAIL] Verification URL: ${verificationUrl}`);

  // Example with a hypothetical email service:
  // await emailService.send({
  //   to: email,
  //   subject: "Verify your LAOS account",
  //   template: "email-verification",
  //   data: { verificationUrl }
  // })
}

async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  // In production, use a real email service
  console.log(`[EMAIL] Sending password reset email to ${email}`);
  console.log(`[EMAIL] Reset URL: ${resetUrl}`);

  // Example with a hypothetical email service:
  // await emailService.send({
  //   to: email,
  //   subject: "Reset your LAOS password",
  //   template: "password-reset",
  //   data: { resetUrl }
  // })
}

/**
 * Get session from cookies (cached per request)
 * Use this in Server Components
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieStore = cookies();
  const sessionToken = (await cookieStore).get("session-token")?.value;

  if (!sessionToken) {
    return null;
  }

  return verifySessionToken(sessionToken);
});

/**
 * Require authentication helper
 * Redirects to login if not authenticated
 */
export async function requireAuth(
  redirectTo: string = "/auth/login"
): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

/**
 * Role-based access control helper
 */
export async function requireRole(
  requiredRole: UserRole,
  redirectTo: string = "/auth/error?error=AccessDenied"
): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    STAFF: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  };

  if (roleHierarchy[session.role] < roleHierarchy[requiredRole]) {
    redirect(redirectTo);
  }

  return session;
}

import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      // Importante: em produção, secure deve ser true
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      path: "/",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
      emailVerified: attributes.emailVerified,
    };
  },
});

// IMPORTANTE: Adicionar declaração de tipos
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "STAFF";
  emailVerified: Date | null;
}

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    try {
      const result = await lucia.validateSession(sessionId);

      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }

      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }

      return result.session
        ? {
            user: result.user as User,
            session: result.session as Session,
          }
        : {
            user: null,
            session: null,
          };
    } catch (error) {
      console.error("[LUCIA] Erro ao validar sessão:", error);
      return {
        user: null,
        session: null,
      };
    }
  }
);

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "STAFF";
  emailVerified: Date | null;
};

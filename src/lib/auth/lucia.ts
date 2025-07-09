import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
// Removed React cache because per-request validation must not be memoized

// ============= CONFIGURAÇÃO DO PRISMA =============
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// ============= CONFIGURAÇÃO DO ADAPTADOR =============
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// ============= CONFIGURAÇÃO DO LUCIA =============
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false, // Sessão não expira automaticamente
    attributes: {
      // Configurações de segurança do cookie
      secure: process.env.NODE_ENV === "production", // HTTPS em produção
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      path: "/",
    },
  },
  getUserAttributes: (attributes) => {
    // Mapear atributos do usuário do banco para o Lucia
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
      emailVerified: attributes.emailVerified,
    };
  },
});

// ============= DECLARAÇÃO DE TIPOS PARA O LUCIA =============
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

// ============= TIPOS EXPORTADOS =============
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

// ============= FUNÇÃO DE VALIDAÇÃO DE REQUEST =============
/**
 * Valida a requisição e retorna o usuário e sessão atuais
 * Usa cache do React para otimização de performance
 */
export async function validateRequest(): Promise<
  { user: User; session: Session } | { user: null; session: null }
> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return {
      user: null,
      session: null,
    };
  }

  try {
    // Validar sessão com Lucia
    const result = await lucia.validateSession(sessionId);

    // Se a sessão for nova (fresh), atualizar cookie
    if (result.session && result.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }

    // Se não houver sessão, limpar cookie
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

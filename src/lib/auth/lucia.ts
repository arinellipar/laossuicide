import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

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
      image: attributes.image,
      phone: attributes.phone,
      address: attributes.address,
      zipCode: attributes.zipCode,
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
  image: string | null;
  phone: string | null;
  address: string | null;
  zipCode: string | null;
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
  image: string | null;
  phone: string | null;
  address: string | null;
  zipCode: string | null;
};

// ============= FUNÇÃO DE VALIDAÇÃO DE REQUEST =============
/**
 * Valida a requisição e retorna o usuário e sessão atuais
 * Usa cache do React para otimização de performance
 */
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

      if (!sessionId) {
        return {
          user: null,
          session: null,
        };
      }

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

      return result.session && result.user
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

// ============= HELPER FUNCTIONS =============

/**
 * Cria uma nova sessão para o usuário
 */
export async function createSession(userId: string): Promise<Session> {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return session;
}

/**
 * Invalida a sessão atual e limpa o cookie
 */
export async function invalidateSession(): Promise<void> {
  const { session } = await validateRequest();
  
  if (!session) {
    return;
  }

  await lucia.invalidateSession(session.id);
  
  const sessionCookie = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
}

/**
 * Invalida todas as sessões do usuário
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await lucia.invalidateUserSessions(userId);
}

/**
 * Função de login com email e senha
 */
export async function signIn(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}> {
  try {
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "Credenciais inválidas",
      };
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Credenciais inválidas",
      };
    }

    // Criar sessão
    const session = await createSession(user.id);

    return {
      success: true,
      user: user as User,
      session: session,
    };
  } catch (error) {
    console.error("[LUCIA] Erro no login:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Função de registro de novo usuário
 */
export async function signUp(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<{
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}> {
  try {
    const { email, password, name } = data;

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Este email já está em uso",
      };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        role: "USER",
      },
    });

    // Criar sessão
    const session = await createSession(user.id);

    return {
      success: true,
      user: user as User,
      session: session,
    };
  } catch (error) {
    console.error("[LUCIA] Erro no registro:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Função de logout
 */
export async function signOut(): Promise<void> {
  await invalidateSession();
}

/**
 * Middleware para verificar se o usuário está autenticado
 * Redireciona para login se não estiver
 */
export async function requireAuth(): Promise<{ user: User; session: Session }> {
  const { user, session } = await validateRequest();

  if (!user || !session) {
    redirect("/auth/login");
  }

  return { user, session };
}

/**
 * Middleware para verificar se o usuário é admin
 */
export async function requireAdmin(): Promise<{ user: User; session: Session }> {
  const { user, session } = await requireAuth();

  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    redirect("/");
  }

  return { user, session };
}

/**
 * Middleware para verificar se o usuário é super admin
 */
export async function requireSuperAdmin(): Promise<{ user: User; session: Session }> {
  const { user, session } = await requireAuth();

  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return { user, session };
}

/**
 * Atualiza informações do usuário
 */
export async function updateUser(
  userId: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    zipCode: string;
  }>
): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updatedUser as User;
}

/**
 * Altera senha do usuário
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Senha atual incorreta",
      };
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[LUCIA] Erro ao alterar senha:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Verifica email do usuário
 */
export async function verifyEmail(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Busca usuário por ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user as User | null;
}

/**
 * Busca usuário por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  return user as User | null;
}

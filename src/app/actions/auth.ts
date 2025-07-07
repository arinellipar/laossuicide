"use server";

import { lucia, validateRequest } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Schemas de validação com tipagem rigorosa
const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  phone: z
    .string()
    .regex(/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido"),
});

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Types com definição explícita
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;

export type AuthResult = {
  success: boolean;
  error?: string | Record<string, string[]>;
  role?: UserRole;
  redirectUrl?: string;
};

/**
 * Determina o role inicial de um novo usuário
 * Implementa a lógica: primeiro usuário = SUPER_ADMIN, demais = USER
 */
async function determineInitialRole(): Promise<UserRole> {
  try {
    // Verifica se existe algum usuário no sistema
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log("[AUTH] Primeiro usuário do sistema - será SUPER_ADMIN");
      return "SUPER_ADMIN";
    }

    // Se já existem usuários, verifica se existe SUPER_ADMIN
    const superAdminExists = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (!superAdminExists) {
      console.log(
        "[AUTH] Nenhum SUPER_ADMIN encontrado - este será SUPER_ADMIN"
      );
      return "SUPER_ADMIN";
    }

    // Caso contrário, novo usuário será USER comum
    console.log("[AUTH] SUPER_ADMIN já existe - novo usuário será USER");
    return "USER";
  } catch (error) {
    console.error("[AUTH] Erro ao determinar role inicial:", error);
    // Em caso de erro, por segurança, retorna USER
    return "USER";
  }
}

/**
 * Cria um novo usuário com validação completa
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    // Validação dos campos de entrada
    const validatedFields = signUpSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password, name, address, zipCode, phone } =
      validatedFields.data;

    // Verificar duplicação de email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email já cadastrado",
      };
    }

    // Hash da senha com salt factor otimizado
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transação atômica para criação de usuário
    const result = await prisma.$transaction(async (tx) => {
      // Determinar role dentro da transação para evitar condições de corrida
      const assignedRole = await determineInitialRole();

      // Criar usuário
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          address,
          zipCode,
          phone,
          role: assignedRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      console.log(`[AUTH] Usuário criado com sucesso:
        - ID: ${newUser.id}
        - Email: ${newUser.email}
        - Role: ${newUser.role}
      `);

      return newUser;
    });

    // Criar sessão Lucia
    const session = await lucia.createSession(result.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Definir cookie de sessão
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Determinar URL de redirecionamento baseado no role
    const redirectUrl =
      result.role === "SUPER_ADMIN" || result.role === "ADMIN"
        ? "/dashboard"
        : "/user";

    return {
      success: true,
      role: result.role,
      redirectUrl,
    };
  } catch (error) {
    console.error("[AUTH] Erro ao criar usuário:", error);
    return {
      success: false,
      error: "Erro ao criar conta. Tente novamente.",
    };
  }
}

/**
 * Realiza login com validação de credenciais
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validação de entrada
    const validatedFields = signInSchema.safeParse({ email, password });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Buscar usuário com campos necessários
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
      },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "Email ou senha inválidos",
      };
    }

    // Verificar senha com timing-attack protection
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return {
        success: false,
        error: "Email ou senha inválidos",
      };
    }

    // Criar sessão
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    console.log(`[AUTH] Login realizado:
      - Email: ${user.email}
      - Role: ${user.role}
    `);

    // Determinar redirecionamento
    const redirectUrl =
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      user.role === "STAFF"
        ? "/dashboard"
        : "/user";

    return {
      success: true,
      role: user.role,
      redirectUrl,
    };
  } catch (error) {
    console.error("[AUTH] Erro ao fazer login:", error);
    return {
      success: false,
      error: "Erro ao fazer login. Tente novamente.",
    };
  }
}

/**
 * Realiza logout e invalida sessão
 */
export async function signOut() {
  try {
    const { session } = await validateRequest();

    if (!session) {
      return {
        error: "Não autenticado",
      };
    }

    // Invalidar sessão no Lucia
    await lucia.invalidateSession(session.id);

    // Criar cookie de sessão em branco
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Redirecionar para home
    redirect("/");
  } catch (error) {
    console.error("[AUTH] Erro ao fazer logout:", error);
    return {
      error: "Erro ao fazer logout",
    };
  }
}

/**
 * Obtém usuário autenticado atual
 */
export async function getUser() {
  const { user } = await validateRequest();
  return user;
}

/**
 * Atualiza perfil do usuário com validação
 */
export async function updateProfile(data: {
  name?: string;
  address?: string;
  zipCode?: string;
  phone?: string;
}) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return {
        success: false,
        error: "Não autenticado",
      };
    }

    // Validação e sanitização dos dados
    const updateData: Partial<typeof data> = {};

    if (data.name && data.name.length >= 2) {
      updateData.name = data.name.trim();
    }

    if (data.address && data.address.length >= 5) {
      updateData.address = data.address.trim();
    }

    if (data.zipCode && /^\d{5}-?\d{3}$/.test(data.zipCode)) {
      updateData.zipCode = data.zipCode.replace(/\D/g, "");
    }

    if (data.phone && /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(data.phone)) {
      updateData.phone = data.phone.replace(/\D/g, "");
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        address: true,
        zipCode: true,
        phone: true,
        role: true,
      },
    });

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("[AUTH] Erro ao atualizar perfil:", error);
    return {
      success: false,
      error: "Erro ao atualizar perfil",
    };
  }
}

/**
 * Altera senha do usuário com verificação
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return {
        success: false,
        error: "Não autenticado",
      };
    }

    // Buscar usuário com senha
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword?.password) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(
      currentPassword,
      userWithPassword.password
    );

    if (!validPassword) {
      return {
        success: false,
        error: "Senha atual incorreta",
      };
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "Nova senha deve ter no mínimo 6 caracteres",
      };
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "Senha alterada com sucesso",
    };
  } catch (error) {
    console.error("[AUTH] Erro ao alterar senha:", error);
    return {
      success: false,
      error: "Erro ao alterar senha",
    };
  }
}

/**
 * Verifica se usuário tem permissão administrativa
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const { user } = await validateRequest();

    if (!user) return false;

    return ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role);
  } catch {
    return false;
  }
}

/**
 * Verifica se usuário é SUPER_ADMIN
 */
export async function checkSuperAdminAccess(): Promise<boolean> {
  try {
    const { user } = await validateRequest();

    if (!user) return false;

    return user.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

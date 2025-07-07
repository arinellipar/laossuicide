"use server";

import { lucia, validateRequest } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schemas de validação
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

// Types
type SignUpData = z.infer<typeof signUpSchema>;

type AuthResult = {
  success: boolean;
  error?: string | Record<string, string[]>;
  role?: string;
};

// Função para criar um novo usuário
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    // Validar campos
    const validatedFields = signUpSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password, name, address, zipCode, phone } =
      validatedFields.data;

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email já cadastrado",
      };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // Verificar se o email é o email de admin definido no ambiente
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
        console.log("Email corresponde ao ADMIN_EMAIL definido - será ADMIN");

        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            address,
            zipCode,
            phone,
            role: "ADMIN",
          },
        });

        return { user: newUser, role: "ADMIN" };
      }

      // Verificar dentro da transação se existe algum usuário
      const existingUserCount = await tx.user.count();
      const hasNoUsers = existingUserCount === 0;

      let assignedRole: "ADMIN" | "USER" = "USER";

      if (hasNoUsers) {
        assignedRole = "ADMIN";
        console.log("Primeiro usuário do sistema - será ADMIN");
      } else {
        // Verificar se existe ADMIN
        const adminExists = await tx.user.findFirst({
          where: { role: "ADMIN" },
        });

        if (!adminExists) {
          assignedRole = "ADMIN";
          console.log("Nenhum ADMIN encontrado - este será ADMIN");
        } else {
          assignedRole = "USER";
          console.log("ADMIN já existe - este será USER");
        }
      }

      // Criar o usuário com o role determinado
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
      });

      return { user: newUser, role: assignedRole };
    });

    const user = result.user;
    console.log("Usuário criado com sucesso:");
    console.log("- Email:", user.email);
    console.log("- Role:", user.role);

    // Criar sessão
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    const finalRole = user.role;
    console.log("Role final retornado:", finalRole);

    return {
      success: true,
      role: finalRole,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      success: false,
      error: "Erro ao criar conta. Tente novamente.",
    };
  }
}

// Função para fazer login
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validar campos
    const validatedFields = signInSchema.safeParse({ email, password });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "Email ou senha inválidos",
      };
    }

    // Verificar senha
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

    console.log("Usuário logado com sucesso:");
    console.log("- Email:", user.email);
    console.log("- Role:", user.role);

    return {
      success: true,
      role: user.role || "USER",
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return {
      success: false,
      error: "Erro ao fazer login. Tente novamente.",
    };
  }
}

// Função para fazer logout
export async function signOut() {
  try {
    const { session } = await validateRequest();

    if (!session) {
      return {
        error: "Não autenticado",
      };
    }

    // Invalidar sessão
    await lucia.invalidateSession(session.id);

    // Limpar cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    redirect("/");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return {
      error: "Erro ao fazer logout",
    };
  }
}

// Função para verificar se o usuário está autenticado
export async function getUser() {
  const { user } = await validateRequest();
  return user;
}

// Função para atualizar perfil do usuário
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

    // Validar dados (você pode criar um schema específico)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name && data.name.length >= 2) {
      updateData.name = data.name;
    }

    if (data.address && data.address.length >= 5) {
      updateData.address = data.address;
    }

    if (data.zipCode && /^\d{5}-?\d{3}$/.test(data.zipCode)) {
      updateData.zipCode = data.zipCode;
    }

    if (data.phone && /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(data.phone)) {
      updateData.phone = data.phone;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return {
      success: false,
      error: "Erro ao atualizar perfil",
    };
  }
}

// Função para alterar senha
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
    });

    if (!userWithPassword || !userWithPassword.password) {
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

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
    console.error("Erro ao alterar senha:", error);
    return {
      success: false,
      error: "Erro ao alterar senha",
    };
  }
}

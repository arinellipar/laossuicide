"use server";

import { lucia, validateRequest } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

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

type SignUpData = z.infer<typeof signUpSchema>;

export async function signUp(data: SignUpData) {
  try {
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

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        address,
        zipCode,
        phone,
        role: "USER",
      },
    });

    // Criar sessão
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      success: false,
      error: "Erro ao criar conta. Tente novamente.",
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
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

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return {
      success: false,
      error: "Erro ao fazer login. Tente novamente.",
    };
  }
}

export async function signOut() {
  const { session } = await validateRequest();

  if (!session) {
    return {
      error: "Não autenticado",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect("/");
}

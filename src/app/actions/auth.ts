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
});

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function signUp(formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, name } = validatedFields.data;

  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error: {
          email: ["Email já cadastrado"],
        },
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
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      error: {
        _form: ["Erro ao criar conta. Tente novamente."],
      },
    };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return {
        error: {
          _form: ["Email ou senha inválidos"],
        },
      };
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return {
        error: {
          _form: ["Email ou senha inválidos"],
        },
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
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return {
      error: {
        _form: ["Erro ao fazer login. Tente novamente."],
      },
    };
  }

  redirect("/dashboard");
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

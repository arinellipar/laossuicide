import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface RouteParams {
  params: {
    userId: string;
  };
}

const VALID_ROLES: UserRole[] = ["USER", "STAFF", "ADMIN", "SUPER_ADMIN"];

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas SUPER_ADMIN e ADMIN podem alterar roles
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Obter novo role do body
    const body = await request.json();
    const { role: newRole } = body;

    // Validar role
    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: "Role inválido. Valores aceitos: " + VALID_ROLES.join(", ") },
        { status: 400 }
      );
    }

    // Buscar usuário alvo
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validações de permissão hierárquica

    // 1. Não pode alterar o próprio role
    if (user.id === params.userId) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio role" },
        { status: 400 }
      );
    }

    // 2. ADMIN não pode alterar SUPER_ADMIN ou outro ADMIN
    if (user.role === "ADMIN") {
      if (targetUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Admin não pode alterar Super Admin" },
          { status: 403 }
        );
      }

      if (targetUser.role === "ADMIN") {
        return NextResponse.json(
          { error: "Admin não pode alterar outro Admin" },
          { status: 403 }
        );
      }

      // ADMIN só pode promover USER para STAFF ou STAFF para USER
      if (!["USER", "STAFF"].includes(newRole)) {
        return NextResponse.json(
          { error: "Admin só pode atribuir roles USER ou STAFF" },
          { status: 403 }
        );
      }
    }

    // 3. Garantir que sempre exista pelo menos um SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN" },
      });

      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Deve existir pelo menos um Super Admin no sistema" },
          { status: 400 }
        );
      }
    }

    // Atualizar o role
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`[API] Role alterado:
      - Alterado por: ${user.email} (${user.role})
      - Usuário: ${targetUser.email}
      - Role anterior: ${targetUser.role}
      - Novo role: ${newRole}
    `);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[API] Erro ao atualizar role:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar role" },
      { status: 500 }
    );
  }
}

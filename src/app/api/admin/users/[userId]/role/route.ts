import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Pegar o novo role do body
    const { role } = await request.json();

    // Validar o role
    const validRoles = ["USER", "STAFF", "ADMIN", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    // Impedir que um admin altere um super admin
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (targetUser.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Apenas super admins podem alterar outros super admins" },
        { status: 403 }
      );
    }

    // Impedir que o usuário altere seu próprio role
    if (user.id === params.userId) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio role" },
        { status: 400 }
      );
    }

    // Atualizar o role do usuário
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar role" },
      { status: 500 }
    );
  }
}

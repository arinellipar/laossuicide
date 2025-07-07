import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth/lucia";

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        address: true,
        phone: true,
        zipCode: true,
        createdAt: true,
        updatedAt: true,
        sessions: {
          select: {
            id: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("[API] Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode deletar usuários
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Apenas Super Admin pode deletar usuários" },
        { status: 403 }
      );
    }

    // Impedir exclusão do próprio usuário
    if (user.id === params.userId) {
      return NextResponse.json(
        { error: "Você não pode deletar sua própria conta" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Impedir exclusão de outro SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não é possível deletar outro Super Admin" },
        { status: 403 }
      );
    }

    // Transação para deletar usuário e suas sessões
    await prisma.$transaction(async (tx) => {
      // Buscar todas as sessões do usuário
      const sessions = await tx.session.findMany({
        where: { userId: params.userId },
        select: { id: true },
      });

      // Invalidar todas as sessões no Lucia
      for (const session of sessions) {
        await lucia.invalidateSession(session.id);
      }

      // Deletar o usuário (as sessões serão deletadas em cascata)
      await tx.user.delete({
        where: { id: params.userId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}

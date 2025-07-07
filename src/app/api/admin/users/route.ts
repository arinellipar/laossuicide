import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verificar autenticação e autorização
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas SUPER_ADMIN, ADMIN e STAFF podem listar usuários
    if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar usuários com informações relevantes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        address: true,
        phone: true,
        zipCode: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // SUPER_ADMIN primeiro
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

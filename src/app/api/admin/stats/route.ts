import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar estatísticas com queries paralelas para otimização
    const [totalUsers, roleDistribution, recentUsers, activeSessions] =
      await Promise.all([
        // Total de usuários
        prisma.user.count(),

        // Distribuição por role
        prisma.user.groupBy({
          by: ["role"],
          _count: true,
        }),

        // Usuários recentes (últimos 30 dias)
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Sessões ativas
        prisma.session.count({
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
      ]);

    const stats = {
      totalUsers,
      recentUsers,
      activeSessions,
      roleDistribution: roleDistribution.reduce((acc, curr) => {
        acc[curr.role] = curr._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API] Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}

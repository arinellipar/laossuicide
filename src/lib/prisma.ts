import { PrismaClient } from "@prisma/client";

// ============= CONFIGURAÇÃO GLOBAL DO PRISMA =============
/**
 * Declaração global para evitar múltiplas instâncias em desenvolvimento
 * O Next.js faz hot reloading, o que pode criar múltiplas conexões
 */
declare global {
  var prisma: PrismaClient | undefined;
}

// ============= INICIALIZAÇÃO DO CLIENTE =============
/**
 * Singleton pattern para garantir uma única instância do PrismaClient
 * Em produção: sempre cria nova instância
 * Em desenvolvimento: reutiliza instância global
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

// ============= ARMAZENAMENTO GLOBAL EM DEV =============
/**
 * Em desenvolvimento, armazena a instância globalmente
 * Isso evita criar múltiplas conexões durante hot reload
 */
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// ============= HOOKS DO PRISMA (OPCIONAL) =============
/**
 * Middleware para logging avançado (descomente se necessário)
 */
// prisma.$use(async (params, next) => {
//   const before = Date.now();
//   const result = await next(params);
//   const after = Date.now();
//
//   console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
//
//   return result;
// });

// ============= TRATAMENTO DE SHUTDOWN =============
/**
 * Garante desconexão limpa ao encerrar a aplicação
 */
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

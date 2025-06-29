// src/lib/prisma.ts

import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Configuração de logging com formatação estruturada
 * Facilita integração com sistemas de observabilidade (DataDog, New Relic, etc)
 */
const logDefinitions: Prisma.LogDefinition[] = [
  {
    level: "query",
    emit: "event",
  },
  {
    level: "info",
    emit: "event",
  },
  {
    level: "warn",
    emit: "event",
  },
  {
    level: "error",
    emit: "event",
  },
];

/**
 * Interface para métricas de performance de queries
 * Utilizada para monitoramento e otimização
 */
interface QueryMetrics {
  model?: string;
  action?: string;
  duration: number;
  timestamp: Date;
  params?: Record<string, unknown>;
}

/**
 * Buffer de métricas para análise de performance
 * Implementa padrão circular buffer para eficiência de memória
 */
class MetricsBuffer {
  private buffer: QueryMetrics[] = [];
  private maxSize: number = 1000;
  private pointer: number = 0;

  add(metric: QueryMetrics): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(metric);
    } else {
      this.buffer[this.pointer] = metric;
      this.pointer = (this.pointer + 1) % this.maxSize;
    }
  }

  getMetrics(): QueryMetrics[] {
    return [...this.buffer];
  }

  getAverageQueryTime(model?: string): number {
    const relevantMetrics = model
      ? this.buffer.filter((m) => m.model === model)
      : this.buffer;

    if (relevantMetrics.length === 0) return 0;

    const totalTime = relevantMetrics.reduce((acc, m) => acc + m.duration, 0);
    return totalTime / relevantMetrics.length;
  }

  getSlowQueries(threshold: number = 100): QueryMetrics[] {
    return this.buffer
      .filter((m) => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  clear(): void {
    this.buffer = [];
    this.pointer = 0;
  }
}

/**
 * Singleton instance do MetricsBuffer
 * Garante uma única instância global para coleta de métricas
 */
const metricsBuffer = new MetricsBuffer();

/**
 * Configuração de middleware para interceptação de queries
 * Permite implementar lógica transversal como soft deletes, multi-tenancy, etc
 */
function applyMiddleware(client: PrismaClient): PrismaClient {
  // Middleware para soft deletes automático
  client.$use(async (params, next) => {
    // Aplicar soft delete para modelos configurados
    const softDeleteModels = ["User", "Order", "Product"]; // Configurar conforme necessário

    if (softDeleteModels.includes(params.model ?? "")) {
      if (params.action === "delete") {
        params.action = "update";
        params.args["data"] = { deletedAt: new Date() };
      }

      if (params.action === "deleteMany") {
        params.action = "updateMany";
        if (params.args.data !== undefined) {
          params.args.data["deletedAt"] = new Date();
        } else {
          params.args["data"] = { deletedAt: new Date() };
        }
      }

      // Filtrar registros deletados em queries de leitura
      if (params.action === "findUnique" || params.action === "findFirst") {
        params.action = "findFirst";
        params.args.where["deletedAt"] = null;
      }

      if (params.action === "findMany") {
        if (params.args.where !== undefined) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where["deletedAt"] = null;
          }
        } else {
          params.args["where"] = { deletedAt: null };
        }
      }
    }

    return next(params);
  });

  // Middleware para logging de performance
  client.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // Log queries lentas (> 100ms)
    if (duration > 100) {
      console.warn(`⚠️ Slow query detected (${duration}ms):`, {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
      });
    }

    // Coletar métricas detalhadas
    metricsBuffer.add({
      model: params.model,
      action: params.action,
      duration,
      timestamp: new Date(),
    });

    return result;
  });

  // Middleware para retry automático em caso de erro de conexão
  client.$use(async (params, next) => {
    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo

    while (retries < maxRetries) {
      try {
        return await next(params);
      } catch (error: unknown) {
        retries++;

        // Verificar se é erro de conexão
        const isConnectionError =
          typeof error === "object" &&
          error !== null &&
          ((typeof (error as { code?: unknown }).code === "string" &&
            ((error as { code: string }).code === "P2002" || // Unique constraint
              (error as { code: string }).code === "P2025")) || // Record not found
            (typeof (error as { message?: unknown }).message === "string" &&
              ((error as { message: string }).message.includes("connection") ||
                (error as { message: string }).message.includes("timeout"))));

        if (isConnectionError && retries < maxRetries) {
          console.warn(`Retrying query (attempt ${retries}/${maxRetries})...`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * retries)
          );
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Failed after ${maxRetries} retries`);
  });

  return client;
}

/**
 * Extensão do PrismaClient com funcionalidades adicionais
 * Implementa padrões de repository e helpers úteis
 */
class ExtendedPrismaClient extends PrismaClient {
  private static instance: ExtendedPrismaClient;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    super({
      log: logDefinitions,
      errorFormat: "pretty",
    });
  }

  /**
   * Implementação do padrão Singleton
   * Garante uma única instância do cliente em toda a aplicação
   */
  static getInstance(): ExtendedPrismaClient {
    if (!ExtendedPrismaClient.instance) {
      ExtendedPrismaClient.instance = new ExtendedPrismaClient();

      // Aplicar middlewares
      applyMiddleware(ExtendedPrismaClient.instance as PrismaClient);

      // Aplicar extensões
      if (process.env.FIELD_ENCRYPTION_KEY) {
        // Exemplo de extensão para criptografia de campos
        // ExtendedPrismaClient.instance = ExtendedPrismaClient.instance.$extends(
        //   fieldEncryptionExtension({
        //     encryptionKey: process.env.FIELD_ENCRYPTION_KEY,
        //   })
        // ) as ExtendedPrismaClient;
      }
    }

    return ExtendedPrismaClient.instance;
  }

  /**
   * Método para garantir conexão antes de executar queries
   * Útil para cold starts em ambientes serverless
   */
  async ensureConnected(): Promise<void> {
    if (!this.connectionPromise) {
      this.connectionPromise = this.$connect();
    }
    await this.connectionPromise;
  }

  /**
   * Wrapper para transações com retry automático
   * Implementa padrão de resiliência para operações críticas
   */
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    const defaultOptions = {
      maxWait: 5000, // 5 segundos
      timeout: 10000, // 10 segundos
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    };

    return this.$transaction(fn, { ...defaultOptions, ...options });
  }

  /**
   * Helper para executar queries em batch com controle de concorrência
   * Otimiza performance para operações em massa
   */
  async batchOperation<T>(
    items: T[],
    operation: (item: T) => Promise<unknown>,
    options?: {
      batchSize?: number;
      concurrency?: number;
    }
  ): Promise<unknown[]> {
    const { batchSize = 100, concurrency = 5 } = options || {};
    const results: unknown[] = [];

    // Dividir em batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    // Processar batches com controle de concorrência
    for (let i = 0; i < batches.length; i += concurrency) {
      const batchPromises = batches
        .slice(i, i + concurrency)
        .map((batch) => Promise.all(batch.map(operation)));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }

    return results;
  }

  /**
   * Helper para paginação cursor-based
   * Mais eficiente que offset-based para grandes datasets
   */
  async findManyCursor<
    T extends { id: string },
    M extends { findMany: (args: unknown) => Promise<T[]> }
  >(
    model: M,
    options: {
      cursor?: string;
      take?: number;
      where?: Record<string, unknown>;
      orderBy?: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>;
      include?: unknown;
    }
  ): Promise<{
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const {
      cursor,
      take = 20,
      where = {},
      orderBy = { id: "asc" },
      include,
    } = options;

    const queryOptions: Record<string, unknown> = {
      take: take + 1, // Pegar um a mais para verificar se há próxima página
      where,
      orderBy,
      include,
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Pular o cursor atual
    }

    const items = await model.findMany(queryOptions);
    const hasMore = items.length > take;
    const resultItems = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : null;

    return {
      items: resultItems,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Métrica de saúde do banco de dados
   * Útil para health checks e monitoramento
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    responseTime: number;
    details: unknown;
  }> {
    const startTime = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        details: {
          avgQueryTime: metricsBuffer.getAverageQueryTime(),
          slowQueries: metricsBuffer.getSlowQueries().length,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Obter métricas de performance
   */
  getMetrics() {
    return {
      all: metricsBuffer.getMetrics(),
      averageQueryTime: metricsBuffer.getAverageQueryTime(),
      slowQueries: metricsBuffer.getSlowQueries(),
      byModel: (model: string) => ({
        averageTime: metricsBuffer.getAverageQueryTime(model),
        queries: metricsBuffer.getMetrics().filter((m) => m.model === model),
      }),
    };
  }

  /**
   * Limpar cache de métricas
   */
  clearMetrics() {
    metricsBuffer.clear();
  }
}

/**
 * Instância global do Prisma Client
 * Em desenvolvimento, armazena no global para evitar múltiplas conexões durante hot reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? ExtendedPrismaClient.getInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Tipos auxiliares para uso com Prisma
 * Facilitam a tipagem em componentes e APIs
 */
export type { Prisma } from "@prisma/client";

/**
 * Helper type para extrair o tipo de retorno de uma query Prisma
 */
export type PrismaQueryResult<T extends (...args: unknown[]) => unknown> =
  T extends (...args: unknown[]) => Promise<infer R> ? R : never;

/**
 * Helper type para argumentos de where clause com autocomplete
 */
export type WhereInput<T> = T extends { findMany(args?: infer Args): unknown }
  ? Args extends { where?: infer Where }
    ? Where
    : never
  : never;

/**
 * Helper type para argumentos de include/select
 */
export type IncludeInput<T> = T extends { findMany(args?: infer Args): unknown }
  ? Args extends { include?: infer Include }
    ? Include
    : never
  : never;

/**
 * Utility functions para trabalhar com Prisma
 */
export const prismaUtils = {
  /**
   * Converte erro do Prisma em mensagem amigável
   */
  formatError(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return `Duplicate value for unique field: ${error.meta?.target}`;
        case "P2025":
          return "Record not found";
        case "P2003":
          return `Foreign key constraint failed: ${error.meta?.field_name}`;
        case "P2014":
          return `Invalid ID: ${error.meta?.model_name}`;
        default:
          return error.message;
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: string }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
    return "Unknown database error";
  },

  /**
   * Helper para construir queries complexas com filtros dinâmicos
   */
  buildWhereClause(filters: Record<string, unknown>): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      // Suporte para operadores especiais
      if (key.endsWith("_gte")) {
        const field = key.replace("_gte", "");
        where[field] = { gte: value };
      } else if (key.endsWith("_lte")) {
        const field = key.replace("_lte", "");
        where[field] = { lte: value };
      } else if (key.endsWith("_contains")) {
        const field = key.replace("_contains", "");
        where[field] = { contains: value, mode: "insensitive" };
      } else if (key.endsWith("_in")) {
        const field = key.replace("_in", "");
        where[field] = { in: value };
      } else {
        where[key] = value;
      }
    });

    return where;
  },

  /**
   * Helper para ordenação dinâmica
   */
  buildOrderBy(
    sortField?: string,
    sortOrder?: "asc" | "desc"
  ): Record<string, unknown> | undefined {
    if (!sortField) return undefined;

    // Suporte para ordenação aninhada (ex: "user.name")
    const parts = sortField.split(".");

    if (parts.length === 1) {
      return { [sortField]: sortOrder || "asc" };
    }

    // Construir objeto aninhado
    const orderBy: Record<string, unknown> = {};
    let current = orderBy;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = sortOrder || "asc";

    return orderBy;
  },
};

/**
 * Hook para executar operações no shutdown da aplicação
 * Garante fechamento correto das conexões
 */
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;

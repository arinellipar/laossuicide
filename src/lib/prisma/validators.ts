// src/lib/prisma/validators.ts

import { z } from "zod";

/**
 * Sistema de validação type-safe para operações Prisma
 * Implementa validação em runtime com inferência de tipos TypeScript
 */

/**
 * Schemas base reutilizáveis para tipos comuns
 * Seguem padrões de validação consistentes em toda aplicação
 */
export const commonSchemas = {
  // IDs com validação de formato
  id: z.string().cuid(),
  uuid: z.string().uuid(),

  // Strings com sanitização
  email: z.string().email().toLowerCase().trim(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),

  // URLs com validação de protocolo
  url: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),

  // Números com ranges
  positiveInt: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
  price: z.number().positive().multipleOf(0.01),

  // Datas com validação de range
  futureDate: z
    .date()
    .refine((date) => date > new Date(), "Date must be in the future"),
  pastDate: z
    .date()
    .refine((date) => date < new Date(), "Date must be in the past"),

  // Enums comuns
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "ARCHIVED"]),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]),

  // Arrays com validação de tamanho
  tags: z.array(z.string()).max(10),
  ids: z.array(z.string().cuid()).min(1),

  // Objetos JSON com estrutura
  metadata: z.record(z.string(), z.any()),

  // Paginação
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),

  // Ordenação
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Busca
  searchTerm: z.string().min(2).max(100).optional(),
};

/**
 * Validadores específicos para modelos do schema Prisma
 * Gerados baseados no schema definido
 */
export const trackValidators = {
  // Criação de Track
  create: z.object({
    title: z.string().min(1).max(200),
    artist: z.string().min(1).max(100).default("LAOS"),
    duration: commonSchemas.positiveInt,
    fileUrl: commonSchemas.url.optional(),
    fileSize: commonSchemas.positiveInt.optional(),
    mimeType: z.string().regex(/^audio\//),
    album: z.string().max(100).optional(),
    genre: z.string().max(50).optional(),
    bpm: z.number().int().min(60).max(200).optional(),
    key: z.string().max(10).optional(),
    waveformData: z.array(z.number()).optional(),
    thumbnailUrl: commonSchemas.url.optional(),
    isPublic: z.boolean().default(false),
  }),

  // Atualização de Track
  update: z.object({
    title: z.string().min(1).max(200).optional(),
    artist: z.string().min(1).max(100).optional(),
    album: z.string().max(100).optional(),
    genre: z.string().max(50).optional(),
    bpm: z.number().int().min(60).max(200).optional(),
    key: z.string().max(10).optional(),
    thumbnailUrl: commonSchemas.url.optional(),
    isPublic: z.boolean().optional(),
  }),

  // Filtros de busca
  filters: z.object({
    artist: z.string().optional(),
    genre: z.string().optional(),
    isPublic: z.boolean().optional(),
    minDuration: commonSchemas.positiveInt.optional(),
    maxDuration: commonSchemas.positiveInt.optional(),
    search: commonSchemas.searchTerm,
  }),
};

/**
 * Validadores para User com regras de negócio
 */
export const userValidators = {
  create: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password.refine((password) => {
      // Validação de força da senha
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*]/.test(password);

      return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }, "Password must contain uppercase, lowercase, numbers and special characters"),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    displayName: z.string().min(3).max(50).optional(),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
  }),

  update: z.object({
    email: commonSchemas.email.optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    displayName: z.string().min(3).max(50).optional(),
    avatarUrl: commonSchemas.url.optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
  }),

  changePassword: z
    .object({
      currentPassword: z.string(),
      newPassword: commonSchemas.password,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
};

/**
 * Validadores para Order com lógica de negócio complexa
 */
export const orderValidators = {
  create: z.object({
    items: z
      .array(
        z.object({
          productId: commonSchemas.id,
          quantity: commonSchemas.positiveInt,
          price: commonSchemas.price,
          size: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .min(1),
    shippingAddressId: commonSchemas.id.optional(),
    paymentMethodId: commonSchemas.id.optional(),
    notes: z.string().max(500).optional(),
  }),

  updateStatus: z
    .object({
      status: z.enum([
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ]),
      reason: z.string().optional(),
    })
    .refine(
      (data) => {
        // Requerer razão para cancelamento ou reembolso
        if (["CANCELLED", "REFUNDED"].includes(data.status) && !data.reason) {
          return false;
        }
        return true;
      },
      {
        message: "Reason is required for cancellation or refund",
        path: ["reason"],
      }
    ),
};

/**
 * Tipos TypeScript inferidos dos validadores
 * Garante consistência entre validação e tipos
 */
export type TrackCreateInput = z.infer<typeof trackValidators.create>;
export type TrackUpdateInput = z.infer<typeof trackValidators.update>;
export type TrackFilters = z.infer<typeof trackValidators.filters>;

export type UserCreateInput = z.infer<typeof userValidators.create>;
export type UserUpdateInput = z.infer<typeof userValidators.update>;
export type UserChangePasswordInput = z.infer<
  typeof userValidators.changePassword
>;

export type OrderCreateInput = z.infer<typeof orderValidators.create>;
export type OrderUpdateStatusInput = z.infer<
  typeof orderValidators.updateStatus
>;

/**
 * Função helper para validar e sanitizar input
 * Retorna dados validados ou lança erro com detalhes
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Validation failed", error.errors);
    }
    throw error;
  }
}

/**
 * Função para validação assíncrona com dados externos
 * Útil para validações que requerem consulta ao banco
 */
export async function validateWithContext<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  // Primeiro validar estrutura básica
  const validated = validateInput(schema, data);

  // Adicionar validações contextuais aqui
  // Exemplo: verificar unicidade, permissões, etc.

  return validated;
}

/**
 * Classe de erro customizada para validações
 * Fornece estrutura consistente para erros de validação
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[],
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
}

/**
 * Tipos utilitários para Prisma com type safety aprimorado
 */
/**
 * Tipo para extrair o payload de uma operação Prisma
 */
export type ExtractPayload<T> = T extends (
  ...args: unknown[]
) => Promise<infer R>
  ? R
  : never;

/**
 * Tipo para argumentos de create com relações
 */
export type CreateWithRelations<T> = T extends {
  create(args: infer Args): unknown;
}
  ? Args
  : never;

/**
 * Tipo para where clause com operadores avançados
 */
export type WhereWithOperators<T> = T & {
  AND?: T | T[];
  OR?: T | T[];
  NOT?: T | T[];
};

/**
 * Tipo para select dinâmico
 */
export type DynamicSelect<T> = {
  [K in keyof T]?: boolean | { select?: DynamicSelect<T[K]> };
};

/**
 * Tipo para include com contagem
 */
export type IncludeWithCount<T> = T & {
  _count?:
    | boolean
    | {
        select?: Record<string, boolean>;
      };
};

/**
 * Builders para queries complexas com type safety
 */
export class QueryBuilder<T> {
  private whereClause: Partial<Record<keyof T, unknown>> = {};
  private orderByClause: Partial<Record<keyof T, "asc" | "desc">> = {};
  private includeClause: Record<string, unknown> = {};
  private selectClause: Record<string, unknown> = {};

  where(conditions: Partial<T>): this {
    Object.assign(this.whereClause, conditions);
    return this;
  }

  whereIn<K extends keyof T>(field: K, values: T[K][]): this {
    this.whereClause[field] = { in: values };
    return this;
  }

  whereBetween<K extends keyof T>(field: K, min: T[K], max: T[K]): this {
    this.whereClause[field] = { gte: min, lte: max };
    return this;
  }

  whereContains<K extends keyof T>(field: K, value: string): this {
    this.whereClause[field] = { contains: value, mode: "insensitive" };
    return this;
  }

  orderBy<K extends keyof T>(
    field: K,
    direction: "asc" | "desc" = "asc"
  ): this {
    this.orderByClause[field] = direction;
    return this;
  }

  include(relations: Record<string, unknown>): this {
    Object.assign(this.includeClause, relations);
    return this;
  }

  select(fields: Record<string, unknown>): this {
    Object.assign(this.selectClause, fields);
    return this;
  }

  build() {
    const query: Record<string, unknown> = {};

    if (Object.keys(this.whereClause).length > 0) {
      query.where = this.whereClause;
    }

    if (Object.keys(this.orderByClause).length > 0) {
      query.orderBy = this.orderByClause;
    }

    if (Object.keys(this.includeClause).length > 0) {
      query.include = this.includeClause;
    }

    if (Object.keys(this.selectClause).length > 0) {
      query.select = this.selectClause;
    }

    return query;
  }
}

/**
 * Factory para criar query builders tipados
 */
export function createQueryBuilder<T>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

// Re-export do cliente Prisma para conveniência
export { prisma } from "@/lib/prisma";

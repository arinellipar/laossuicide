// src/lib/validations/common.ts
import { z } from "zod";

/**
 * Common validation schemas for reusable components
 */

/**
 * Pagination schema with sensible defaults
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Search and filter schema
 */
export const searchSchema = z.object({
  q: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * CUID validation schema
 */
export const cuidSchema = z.string().cuid("Invalid CUID format");

/**
 * File upload validation schema
 */
export const fileUploadSchema = z
  .object({
    name: z.string(),
    size: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"),
    type: z.string(),
    lastModified: z.number(),
  })
  .refine((file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    return allowedTypes.includes(file.type);
  }, "File type not allowed");

/**
 * Money/decimal validation with precision
 */
export const moneySchema = z
  .number()
  .positive("Amount must be positive")
  .multipleOf(0.01, "Amount must have at most 2 decimal places")
  .transform((val) => Math.round(val * 100) / 100); // Ensure precision

/**
 * Phone number validation with international format
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number format. Use international format (e.g., +1234567890)"
  );

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required").max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(2).max(50).optional(),
  country: z.string().length(2, "Country must be 2-letter ISO code"),
  postalCode: z.string().min(3).max(20),
});

/**
 * Date range validation with logical constraints
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "Start date must be before or equal to end date",
    path: ["to"],
  });

/**
 * Brazilian document validation schemas
 */
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Invalid CPF format (000.000.000-00)");

export const cnpjSchema = z
  .string()
  .regex(
    /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    "Invalid CNPJ format (00.000.000/0000-00)"
  );

/**
 * Product validation schemas
 */
export const productCategorySchema = z.enum([
  "MERCHANDISE",
  "TICKET",
  "DIGITAL",
  "BUNDLE",
]);

export const productStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DRAFT",
  "ARCHIVED",
]);

/**
 * Order status validation
 */
export const orderStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

/**
 * Type exports for TypeScript integration
 */
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

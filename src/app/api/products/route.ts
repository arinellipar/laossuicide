/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ProductCategory } from "@prisma/client";

// ============= VALIDATION SCHEMAS =============
const ProductFiltersSchema = z.object({
  category: z
    .enum(["CLOTHING", "ACCESSORIES", "VINYL", "DIGITAL", "all"])
    .optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// ============= RESPONSE TYPES =============
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============= GET HANDLER =============
export async function GET(request: NextRequest) {
  try {
    // 1. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawFilters = {
      category: searchParams.get("category") || undefined,
      featured:
        searchParams.get("featured") === "true"
          ? true
          : searchParams.get("featured") === "false"
          ? false
          : undefined,
      inStock:
        searchParams.get("inStock") === "true"
          ? true
          : searchParams.get("inStock") === "false"
          ? false
          : undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 12,
    };

    const validation = ProductFiltersSchema.safeParse(rawFilters);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid filters", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const filters = validation.data;
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    // 2. Build Prisma where clause
    const where: any = {};

    if (filters.category && filters.category !== "all") {
      where.category = filters.category;
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // 3. Build orderBy clause
    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || "desc";
    }

    // 4. Execute queries in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          image: true,
          inStock: true,
          featured: true,
          stockQuantity: true,
          createdAt: true,
          updatedAt: true,
          // Include aggregated data
          _count: {
            select: {
              favorites: true,
              cartItems: true,
              orderItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // 5. Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // 6. Build response
    const response: PaginatedResponse<(typeof products)[0]> = {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    // 7. Set cache headers for performance
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("[Products API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============= POST HANDLER (Admin Only) =============
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement authentication check for admin

    const body = await request.json();

    // Validation schema for creating product
    const CreateProductSchema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().min(1),
      price: z.number().positive(),
      category: z.enum(["CLOTHING", "ACCESSORIES", "VINYL", "DIGITAL"]),
      image: z.string().url(),
      stockQuantity: z.number().int().min(0),
      featured: z.boolean().optional(),
      inStock: z.boolean().optional(),
    });

    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const productData = validation.data;

    // Create product in database
    const product = await prisma.product.create({
      data: {
        ...productData,
        inStock: productData.inStock ?? productData.stockQuantity > 0,
      },
    });

    // TODO: Create product in Stripe if needed
    // const stripeService = getStripeService();
    // const stripeProduct = await stripeService.createProduct(product);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[Products API] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

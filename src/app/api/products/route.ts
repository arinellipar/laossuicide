/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductCategory } from "@prisma/client";

// ============= QUERY PARAMETERS INTERFACE =============
interface ProductsQueryParams {
  category?: ProductCategory | "all";
  featured?: "true" | "false";
  inStock?: "true" | "false";
  search?: string;
  limit?: string;
  offset?: string;
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// ============= GET /api/products =============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: ProductsQueryParams = {
      category: (searchParams.get("category") as ProductCategory | "all") ?? undefined,
      featured: (searchParams.get("featured") as "true" | "false") ?? undefined,
      inStock: (searchParams.get("inStock") as "true" | "false") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      sortBy: (searchParams.get("sortBy") as "name" | "price" | "createdAt") ?? undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
    };

    // Build where clause
    const where: any = {};

    // Category filter
    if (params.category && params.category !== "all") {
      where.category = params.category;
    }

    // Featured filter
    if (params.featured === "true") {
      where.featured = true;
    }

    // Stock filter
    if (params.inStock === "true") {
      where.inStock = true;
    }

    // Search filter
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Pagination
    const limit = params.limit ? parseInt(params.limit) : 20;
    const offset = params.offset ? parseInt(params.offset) : 0;

    // Sorting
    const orderBy: any = {};
    const sortBy = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";
    orderBy[sortBy] = sortOrder;

    // Execute query with error handling
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
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
          stripeProductId: true,
          stripePriceId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate pagination info
    const hasMore = offset + limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    // Response with metadata
    return NextResponse.json({
      products,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore,
        totalPages,
        currentPage,
      },
      filters: {
        category: params.category || "all",
        featured: params.featured === "true",
        inStock: params.inStock === "true",
        search: params.search || "",
      },
    });
  } catch (error) {
    console.error("[API] Error fetching products:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        products: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
          totalPages: 0,
          currentPage: 1,
        },
      },
      { status: 500 }
    );
  }
}

// ============= POST /api/products (Admin only) =============
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const { user } = await validateRequest();
    // if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "category",
      "image",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        image: body.image,
        inStock: body.inStock ?? true,
        featured: body.featured ?? false,
        stockQuantity: body.stockQuantity ?? 0,
        stripeProductId: body.stripeProductId,
        stripePriceId: body.stripePriceId,
        metadata: body.metadata,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

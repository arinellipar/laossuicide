import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { $Enums, Prisma } from "@prisma/client";

// ============= SCHEMA VALIDATION =============
const AddItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID format"),
  quantity: z.number().int().min(1).max(10),
});

// ============= TYPE DEFINITIONS =============
type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true };
}>;

interface CartResponse {
  items: CartItemWithProduct[];
  summary: {
    totalItems: number;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  lastUpdated: Date;
}

// ============= HELPER FUNCTIONS =============
export function calculateCartSummary(
  items: CartItemWithProduct[]
): CartResponse["summary"] {
  let totalItems = 0;
  let subtotal = new Prisma.Decimal(0);

  for (const item of items) {
    totalItems += item.quantity;
    const itemTotal = new Prisma.Decimal(item.product.price).mul(item.quantity);
    subtotal = subtotal.add(itemTotal);
  }

  const subtotalNumber = subtotal.toNumber();
  const tax = subtotalNumber * 0.15; // 15% tax
  const shipping = subtotalNumber >= 200 ? 0 : 20; // Free shipping above R$ 200
  const total = subtotalNumber + tax + shipping;

  return {
    totalItems,
    subtotal: Number(subtotalNumber.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping,
    total: Number(total.toFixed(2)),
  };
}

// ============= API HANDLERS =============

/**
 * GET /api/cart
 * Retorna carrinho do usuário autenticado
 */
export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            image: true,
            inStock: true,
            stockQuantity: true,
            featured: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add missing product fields with default values to match CartResponse type
    const itemsWithDefaults = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        stripeProductId: "",
        stripePriceId: "",
        metadata: {},
      },
    }));

    const summary = getCartSummary(itemsWithDefaults);
    const lastUpdated = new Date();

    const response = {
      items: itemsWithDefaults,
      summary,
      lastUpdated,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[CartAPI] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/cart - Request received");

    const { user } = await validateRequest();
    console.log("[API] Authentication check:", {
      authenticated: !!user,
      userId: user?.id,
    });

    if (!user) {
      console.log("[API] Unauthorized - user not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[API] Request body:", body);

    const validationResult = AddItemSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("[API] Validation failed:", validationResult.error.flatten());
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { productId, quantity } = validationResult.data;
    console.log("[API] Adding to cart:", {
      userId: user.id,
      productId,
      quantity,
    });

    const result = await prisma.$transaction(
      async (tx) => {
        console.log("[API] Starting database transaction");

        // Verificar produto
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            inStock: true,
            stockQuantity: true,
            price: true,
          },
        });

        console.log("[API] Product lookup result:", product);

        if (!product) {
          console.log("[API] Product not found:", productId);
          throw new Error("Product not found");
        }
        if (!product.inStock) {
          console.log("[API] Product out of stock:", product);
          throw new Error("Product out of stock");
        }

        // Verificar item existente
        const existingItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId,
            },
          },
        });

        const newQuantity = (existingItem?.quantity || 0) + quantity;

        if (newQuantity > 10) {
          throw new Error("Maximum 10 units per product");
        }

        if (newQuantity > product.stockQuantity) {
          throw new Error(`Only ${product.stockQuantity} units available`);
        }

        // Verificar limite de produtos únicos
        if (!existingItem) {
          const cartCount = await tx.cartItem.count({
            where: { userId: user.id },
          });

          if (cartCount >= 50) {
            throw new Error("Cart limit reached (50 unique products)");
          }
        }

        // Upsert item
        const cartItem = await tx.cartItem.upsert({
          where: {
            userId_productId: {
              userId: user.id,
              productId,
            },
          },
          update: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            productId,
            quantity,
          },
          include: {
            product: true,
          },
        });

        return cartItem;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    console.log("[API] Transaction completed successfully");

    return NextResponse.json(
      {
        message: "Item added to cart",
        item: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CartAPI] POST error:", error);

    if (error instanceof Error) {
      console.log("[API] Returning error response:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[API] Returning generic error response");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Limpa carrinho completamente
 */
export async function DELETE() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ message: "Cart cleared" }, { status: 200 });
  } catch (error) {
    console.error("[CartAPI] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getCartSummary(
  itemsWithDefaults: {
    product: {
      createdAt: Date;
      updatedAt: Date;
      stripeProductId: string;
      stripePriceId: string;
      metadata: object;
      name: string;
      id: string;
      image: string;
      description: string;
      price: Prisma.Decimal;
      category: $Enums.ProductCategory;
      inStock: boolean;
      featured: boolean;
      stockQuantity: number;
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    productId: string;
    quantity: number;
  }[]
) {
  // Returns a summary of the cart: total items, total quantity, total price
  const totalItems = itemsWithDefaults.length;
  const totalQuantity = itemsWithDefaults.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalPrice = itemsWithDefaults.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return {
    totalItems,
    totalQuantity,
    totalPrice,
  };
}

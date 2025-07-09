import { NextRequest, NextResponse } from "next/server";
// Import zod for schema validation

// Import or define CartItemWithProduct type
import type { CartItemWithProduct } from "@/types/cart"; // Adjust the path as needed
import { Prisma } from "@prisma/client";
import z from "zod";
import { PrismaClient } from "@prisma/client";
import { validateRequest } from "@/lib/auth/lucia";

const prisma = new PrismaClient();

// Define CartResponse type
type CartResponse = {
  items: CartItemWithProduct[];
  summary: {
    totalItems: number;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  lastUpdated: Date;
};

// ============= SCHEMAS =============
const AddItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

// ============= HELPER FUNCTIONS =============
function calculateCartSummary(
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

    // Add missing product fields with default values to satisfy CartItemWithProduct type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsWithDefaults = items.map((item: any) => ({
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

    const summary = calculateCartSummary(itemsWithDefaults);

    const response: CartResponse = {
      items: itemsWithDefaults,
      summary,
      lastUpdated: new Date(),
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

/**
 * POST /api/cart
 * Adiciona item ao carrinho
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/cart - Request received');

    const { user } = await validateRequest();
    console.log('[API] Authentication check:', { authenticated: !!user, userId: user?.id });

    if (!user) {
      console.log('[API] Unauthorized - user not found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('[API] Request body:', body);

    const validationResult = AddItemSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('[API] Validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

        const { productId, quantity } = validationResult.data;
        console.log('[API] Adding to cart:', { userId: user.id, productId, quantity });

        // Start transaction to add item to cart
        const result = await prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            console.log('[API] Starting database transaction');

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

            console.log('[API] Product lookup result:', product);

            if (!product) {
              console.log('[API] Product not found:', productId);
              throw new Error("Product not found");
            }

            if (!product.inStock) {
              console.log("[API] Product out of stock:", product);
              throw new Error("Product out of stock");
            }

            // Add your logic to add the item to the cart here.
            // For now, just return a success response as a placeholder.
            return { message: "Item added to cart (placeholder)" };
          }
        );

        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error("[CartAPI] POST error:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
}
// ============= DELETE /api/cart/{itemId} =============
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
): Promise<NextResponse> {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = params;
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Attempt to delete the cart item
    const deleted = await prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item removed from cart" }, { status: 200 });
  } catch (error) {
    console.error("[CartAPI] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}   
    
// This file handles the API routes for managing the user's cart, including adding items, retrieving the cart, and deleting items from the cart.
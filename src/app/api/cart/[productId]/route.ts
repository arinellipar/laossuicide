import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============= ROUTE PARAMS TYPE =============
interface RouteParams {
  params: {
    productId: string;
  };
}

// ============= VALIDATION SCHEMAS =============
const ProductIdSchema = z.string().cuid("Invalid product ID format");

const UpdateQuantitySchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative")
    .max(10, "Maximum 10 units per product"),
});

// ============= ERROR FACTORY =============
class CartItemError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message);
    this.name = "CartItemError";
  }

  static notFound(productId: string) {
    return new CartItemError("Item not found in cart", 404, "ITEM_NOT_FOUND", {
      productId,
    });
  }

  static invalidQuantity(message: string, currentStock?: number) {
    return new CartItemError(message, 400, "INVALID_QUANTITY", {
      availableStock: currentStock,
    });
  }

  static outOfStock(productName: string) {
    return new CartItemError(
      `${productName} is out of stock`,
      400,
      "OUT_OF_STOCK"
    );
  }

  toResponse() {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      },
      { status: this.statusCode }
    );
  }
}

// ============= HELPER FUNCTIONS =============
function validateProductId(productId: string): string {
  return ProductIdSchema.parse(productId);
}

// ============= API HANDLERS =============

/**
 * GET /api/cart/[productId]
 * Retorna informações de um item específico do carrinho
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = validateProductId(params.productId);

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            category: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    });

    if (!cartItem) {
      return CartItemError.notFound(productId).toResponse();
    }

    const subtotal = Number(cartItem.product.price) * cartItem.quantity;

    return NextResponse.json(
      {
        item: {
          ...cartItem,
          subtotal,
        },
        metadata: {
          canIncrease:
            cartItem.quantity < Math.min(10, cartItem.product.stockQuantity),
          maxQuantity: Math.min(10, cartItem.product.stockQuantity),
          lastUpdated: cartItem.updatedAt,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[CartItemAPI] GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cart/[productId]
 * Atualiza quantidade de um item no carrinho
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = validateProductId(params.productId);
    const body = await request.json();
    const validation = UpdateQuantitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { quantity } = validation.data;

    const result = await prisma.$transaction(
      async (tx) => {
        const currentItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                description: true,
                price: true,
                category: true,
                inStock: true,
                stockQuantity: true,
              },
            },
          },
        });

        if (!currentItem) {
          throw CartItemError.notFound(productId);
        }

        // Se quantity = 0, remover item
        if (quantity === 0) {
          await tx.cartItem.delete({
            where: {
              userId_productId: {
                userId: user.id,
                productId,
              },
            },
          });

          return { action: "removed", item: null };
        }

        // Validar disponibilidade de estoque
        if (!currentItem.product.inStock) {
          throw CartItemError.outOfStock(currentItem.product.name);
        }

        if (quantity > currentItem.product.stockQuantity) {
          throw CartItemError.invalidQuantity(
            `Only ${currentItem.product.stockQuantity} units available`,
            currentItem.product.stockQuantity
          );
        }

        // Atualizar quantidade
        const updatedItem = await tx.cartItem.update({
          where: {
            userId_productId: {
              userId: user.id,
              productId,
            },
          },
          data: {
            quantity,
            updatedAt: new Date(),
          },
          include: {
            product: true,
          },
        });

        return { action: "updated", item: updatedItem };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 2000,
        timeout: 5000,
      }
    );

    if (result.action === "removed") {
      return NextResponse.json(
        { message: "Item removed from cart" },
        { status: 200 }
      );
    }

    if (!result.item) {
      return NextResponse.json(
        { error: "Item not found or already removed" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Item quantity updated",
        item: {
          ...result.item,
          subtotal: Number(result.item.product.price) * result.item.quantity,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CartItemAPI] PATCH error:", error);

    if (error instanceof CartItemError) {
      return error.toResponse();
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[productId]
 * Remove item do carrinho
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = validateProductId(params.productId);

    const deletedItem = await prisma.cartItem
      .delete({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      })
      .catch((error) => {
        // Se não encontrar, operação é idempotente
        if (error.code === "P2025") {
          return null;
        }
        throw error;
      });

    if (deletedItem) {
      console.info("[CartItemAPI] Item removed:", {
        userId: user.id,
        productId: deletedItem.productId,
        productName: deletedItem.product.name,
        quantity: deletedItem.quantity,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: "Item removed from cart",
        ...(deletedItem && {
          removed: {
            productId: deletedItem.productId,
            productName: deletedItem.product.name,
            quantity: deletedItem.quantity,
          },
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CartItemAPI] DELETE error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

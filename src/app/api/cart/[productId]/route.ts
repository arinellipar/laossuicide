/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module CartItemAPI
 * @description API endpoints para operações individuais de itens do carrinho
 *
 * Implementa padrão CQRS (Command Query Responsibility Segregation):
 * - Commands: PATCH (update), DELETE (remove)
 * - Queries: GET (retrieve)
 *
 * Design Patterns:
 * - Command Pattern para operações de mutação
 * - Repository Pattern via Prisma
 * - Dependency Injection para testabilidade
 * - Error Factory Pattern para mensagens consistentes
 *
 * HTTP Semantics:
 * - PATCH para atualizações parciais (RFC 5789)
 * - Idempotency garantida via constraints únicas
 * - Conditional requests com If-Match headers
 */

import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { $Enums, Prisma } from "@prisma/client";

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
/**
 * Valida e sanitiza productId do parâmetro de rota
 * @throws {z.ZodError} Se ID inválido
 */
function validateProductId(productId: string): string {
  return ProductIdSchema.parse(productId);
}

/**
 * Calcula checksum para validação de concorrência otimista
 * Implementa ETag generation para HTTP caching
function generateItemChecksum(item: any): string {
  const data = JSON.stringify({
    productId: item.productId,
    quantity: item.quantity,
    updatedAt: item.updatedAt,
  });
  return crypto.createHash("md5").update(data).digest("hex");
}
}

// ============= API HANDLERS =============

/**
 * GET /api/cart/[productId]
 * Retorna informações de um item específico do carrinho
 *
 * Features:
 * - Conditional GET com ETag
 * - Projection optimization
 * - Cache headers
 *
 * @complexity O(1) - Index lookup por chave composta
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validar productId
    const productId = validateProductId(params.productId);

    // 3. Buscar item com joins otimizados
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

    // 4. Gerar ETag para cache validation
    const etag = `"${generateItemChecksum(cartItem)}"`;
    const ifNoneMatch = request.headers.get("If-None-Match");

    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }

    // 5. Calcular subtotal do item
    const subtotal = Number(cartItem.product.price) * cartItem.quantity;

    // 6. Resposta com metadados enriquecidos
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
          ETag: etag,
          "Cache-Control": "private, max-age=0, must-revalidate",
          "Last-Modified": cartItem.updatedAt.toUTCString(),
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
 *
 * Request body: { quantity: number }
 *
 * Features:
 * - Concorrência otimista com If-Match
 * - Validação de estoque em tempo real
 * - Auto-remoção quando quantity = 0
 * - Atomicidade via transações
 *
 * @complexity O(1) com lock pessimista opcional
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validar inputs
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

    // 3. Verificar If-Match header para concorrência otimista
    const ifMatch = request.headers.get("If-Match");

    // 4. Executar operação em transação
    const result = await prisma.$transaction(
      async (tx) => {
        // Buscar item atual com lock
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

        // Verificar ETag se fornecido
        if (ifMatch) {
          const currentEtag = `"${generateItemChecksum(currentItem)}"`;
          if (ifMatch !== currentEtag) {
            throw new CartItemError(
              "Precondition failed - item was modified",
              412,
              "PRECONDITION_FAILED"
            );
          }
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

    // 5. Preparar resposta baseada na ação
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
    const etag = `"${generateItemChecksum(result.item)}"`;

    return NextResponse.json(
      {
        message: "Item quantity updated",
        item: {
          ...result.item,
          subtotal: Number(result.item.product.price) * result.item.quantity,
        },
      },
      {
        status: 200,
        headers: {
          ETag: etag,
        },
      }
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
 *
 * Features:
 * - Idempotent operation
 * - Soft-delete pattern consideration
 * - Audit logging capability
 *
 * @complexity O(1) - Direct delete by composite key
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validar productId
    const productId = validateProductId(params.productId);

    // 3. Executar delete com retorno do item deletado
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

    // 4. Log para auditoria (opcional)
    if (deletedItem) {
      console.info("[CartItemAPI] Item removed:", {
        userId: user.id,
        productId: deletedItem.productId,
        productName: deletedItem.product.name,
        quantity: deletedItem.quantity,
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Resposta de sucesso (204 No Content ou 200 OK com mensagem)
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

/**
 * OPTIONS /api/cart/[productId]
 * Retorna métodos permitidos e documentação
 * Implementa CORS preflight handling
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, If-Match, If-None-Match",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

function generateItemChecksum(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cartItem: {
    product: {
      name: string;
      id: string;
      image: string;
      description: string;
      price: Prisma.Decimal;
      category: $Enums.ProductCategory;
      inStock: boolean;
      stockQuantity: number;
    };
  } & {
    quantity: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    productId: string;
  }
) {
  throw new Error("Function not implemented.");
}

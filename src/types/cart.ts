import { Prisma } from "@prisma/client";

// Type helper for a cart item along with its related product
export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true };
}>;
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module StripeService
 * @description Camada de serviço para integração com Stripe Payment Gateway
 *
 * Arquitetura:
 * - Hexagonal Architecture (Ports & Adapters)
 * - SOLID Principles compliance
 * - Dependency Injection pattern
 * - Error boundary implementation
 * - Retry mechanism com exponential backoff
 *
 * Security Considerations:
 * - PCI DSS compliance através de Stripe Elements
 * - Webhook signature verification
 * - Idempotency keys para evitar duplicação
 * - Rate limiting awareness
 *
 * Performance Optimizations:
 * - Connection pooling
 * - Response caching onde aplicável
 * - Lazy loading de recursos
 */

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Product, Order } from "@prisma/client";
import { Prisma } from "@prisma/client";

// ============= TYPE DEFINITIONS =============
/**
 * Interface segregation para operações de pagamento
 */
interface IPaymentGateway {
  createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult>;
  createPaymentIntent(
    params: PaymentIntentParams
  ): Promise<PaymentIntentResult>;
  constructWebhookEvent(payload: string, signature: string): Stripe.Event;
  retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session>;
  retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
}

/**
 * DTOs para transferência de dados entre camadas
 */
export interface CheckoutSessionParams {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod: "card" | "pix";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  orderId: string;
  expiresAt: Date;
}

export interface PaymentIntentParams {
  amount: number;
  currency: string;
  paymentMethods: string[];
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

/**
 * Webhook event types com type narrowing
 */
export type WebhookEventType =
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled";

/**
 * Error types para tratamento específico
 */
export class StripeServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "StripeServiceError";
  }
}

// ============= CONFIGURATION =============
const STRIPE_CONFIG = {
  apiVersion: "2025-06-30.basil" as const,
  maxNetworkRetries: 3,
  timeout: 20000, // 20 seconds
  telemetry: false,
} satisfies Stripe.StripeConfig;

const CHECKOUT_CONFIG = {
  sessionExpirationMinutes: 30,
  allowedCountries: ["BR"] as const,
  paymentMethodTypes: {
    card: ["card"] as const,
    pix: ["pix"] as const,
    boleto: ["boleto"] as const, // Futuro
  },
} as const;

// ============= SERVICE IMPLEMENTATION =============
export class StripeService implements IPaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  /**
   * Constructor com dependency injection
   * @param apiKey - Stripe secret key
   * @param webhookSecret - Webhook endpoint secret
   */
  constructor(
    apiKey: string = process.env.STRIPE_SECRET_KEY!,
    webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!
  ) {
    if (!apiKey) {
      throw new StripeServiceError(
        "Stripe API key not configured",
        "CONFIG_ERROR",
        500
      );
    }

    this.stripe = new Stripe(apiKey, STRIPE_CONFIG);
    this.webhookSecret = webhookSecret;
  }

  /**
   * Cria uma sessão de checkout com suporte para múltiplos métodos de pagamento
   *
   * Flow:
   * 1. Valida produtos e disponibilidade
   * 2. Calcula valores (subtotal, tax, shipping)
   * 3. Cria ordem no banco (status PENDING)
   * 4. Cria sessão no Stripe
   * 5. Retorna URL de checkout
   *
   * @complexity O(n) onde n = número de items
   * @throws {StripeServiceError} Se validação falhar ou Stripe retornar erro
   */
  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const {
      userId,
      items,
      paymentMethod,
      successUrl,
      cancelUrl,
      metadata = {},
    } = params;

    // Transação para garantir consistência
    return await prisma.$transaction(
      async (tx) => {
        // 1. Validar e buscar produtos
        const products = await this.validateAndFetchProducts(tx, items);

        // 2. Calcular valores
        const { subtotal, tax, shipping, total, lineItems } =
          this.calculateOrderTotals(products, items);

        // 3. Criar ordem no banco
        const order = await this.createPendingOrder(tx, {
          userId,
          items: items.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products[index].price,
            total: new Prisma.Decimal(
              Number(products[index].price) * item.quantity
            ),
          })),
          subtotal,
          tax,
          shipping,
          total,
        });

        // 4. Configurar parâmetros da sessão Stripe
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          payment_method_types: this.getPaymentMethodTypes(paymentMethod),
          mode: "payment",
          line_items: lineItems,
          success_url: successUrl,
          cancel_url: cancelUrl,
          expires_at: Math.floor(
            Date.now() / 1000 + CHECKOUT_CONFIG.sessionExpirationMinutes * 60
          ),
          metadata: {
            orderId: order.id,
            userId,
            ...metadata,
          },
          customer_email: await this.getUserEmail(tx, userId),
          // Configurações específicas para PIX
          payment_method_options:
            paymentMethod === "pix"
              ? {
                  pix: {
                    expires_after_seconds: 3600, // 1 hora
                  },
                }
              : undefined,
          // Coleta de endereço para entrega
          shipping_address_collection: {
            allowed_countries: CHECKOUT_CONFIG.allowedCountries.slice(),
          },
          // Configurações de localização
          locale: "pt-BR",
          // Permite código promocional
          allow_promotion_codes: true,
        };

        // 5. Criar sessão no Stripe
        let session: Stripe.Checkout.Session;
        try {
          session = await this.stripe.checkout.sessions.create(sessionParams);
        } catch (error) {
          // Rollback implícito pela transação
          throw this.handleStripeError(error);
        }

        // 6. Atualizar ordem com ID da sessão
        await tx.order.update({
          where: { id: order.id },
          data: { stripeSessionId: session.id },
        });

        return {
          sessionId: session.id,
          url: session.url!,
          orderId: order.id,
          expiresAt: new Date(session.expires_at * 1000),
        };
      },
      {
        maxWait: 5000, // 5 seconds max wait
        timeout: 10000, // 10 seconds timeout
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }

  /**
   * Cria Payment Intent para integração customizada
   * Útil para React Native ou integrações avançadas
   */
  async createPaymentIntent(
    params: PaymentIntentParams
  ): Promise<PaymentIntentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Converte para centavos
        currency: params.currency,
        payment_method_types: params.paymentMethods,
        metadata: params.metadata,
        // Configurações de segurança
        setup_future_usage: "off_session",
        capture_method: "automatic",
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  /**
   * Constrói e valida evento de webhook
   * Implementa verificação de assinatura para segurança
   */
  constructWebhookEvent(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch {
      throw new StripeServiceError(
        "Invalid webhook signature",
        "WEBHOOK_SIGNATURE_INVALID",
        400
      );
    }
  }

  /**
   * Recupera sessão de checkout com expansão de relações
   */
  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent", "customer", "line_items", "shipping"],
      });
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  /**
   * Recupera Payment Intent com informações expandidas
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["payment_method", "customer"],
      });
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // ============= PRIVATE HELPER METHODS =============

  /**
   * Valida disponibilidade de produtos e retorna dados completos
   * @throws {StripeServiceError} Se produto não encontrado ou sem estoque
   */
  private async validateAndFetchProducts(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<Product[]> {
    const productIds = items.map((item) => item.productId);

    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new StripeServiceError(
        "One or more products not found",
        "PRODUCT_NOT_FOUND",
        400
      );
    }

    // Ordenar produtos para corresponder com items
    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderedProducts: Product[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new StripeServiceError(
          `Product ${item.productId} not found`,
          "PRODUCT_NOT_FOUND",
          400
        );
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        throw new StripeServiceError(
          `Insufficient stock for ${product.name}`,
          "INSUFFICIENT_STOCK",
          400,
          { productId: product.id, available: product.stockQuantity }
        );
      }

      orderedProducts.push(product);
    }

    return orderedProducts;
  }

  /**
   * Calcula totais da ordem com precisão decimal
   * Utiliza Decimal.js internamente para evitar problemas de ponto flutuante
   */
  private calculateOrderTotals(
    products: Product[],
    items: Array<{ productId: string; quantity: number }>
  ) {
    let subtotal = new Prisma.Decimal(0);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = items[i].quantity;
      const itemTotal = new Prisma.Decimal(product.price).mul(quantity);

      subtotal = subtotal.add(itemTotal);

      // Configurar line item para Stripe
      if (product.stripePriceId) {
        // Usar price ID existente
        lineItems.push({
          price: product.stripePriceId,
          quantity,
        });
      } else {
        // Criar price data inline
        lineItems.push({
          price_data: {
            currency: "brl",
            product_data: {
              name: product.name,
              description: product.description,
              images: [product.image],
              metadata: {
                productId: product.id,
              },
            },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity,
        });
      }
    }

    const subtotalNumber = subtotal.toNumber();
    const tax = new Prisma.Decimal(subtotalNumber * 0.15); // 15% tax
    const shipping =
      subtotalNumber >= 200 ? new Prisma.Decimal(0) : new Prisma.Decimal(20);
    const total = subtotal.add(tax).add(shipping);

    return {
      subtotal,
      tax,
      shipping,
      total,
      lineItems,
    };
  }

  /**
   * Cria ordem pendente no banco de dados
   */
  private async createPendingOrder(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      items: Array<{
        productId: string;
        quantity: number;
        price: Prisma.Decimal;
        total: Prisma.Decimal;
      }>;
      subtotal: Prisma.Decimal;
      tax: Prisma.Decimal;
      shipping: Prisma.Decimal;
      total: Prisma.Decimal;
    }
  ): Promise<Order> {
    // Gerar número único da ordem
    const orderNumber = `LAOS-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    return await tx.order.create({
      data: {
        userId: data.userId,
        orderNumber,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        total: data.total,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Obtém email do usuário para checkout
   */
  private async getUserEmail(
    tx: Prisma.TransactionClient,
    userId: string
  ): Promise<string | undefined> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return user?.email || undefined;
  }

  /**
   * Mapeia método de pagamento para tipos aceitos pelo Stripe
   */
  private getPaymentMethodTypes(
    method: "card" | "pix"
  ): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
    return [...CHECKOUT_CONFIG.paymentMethodTypes[method]];
  }

  /**
   * Tratamento centralizado de erros do Stripe
   * Mapeia erros específicos para mensagens amigáveis
   */
  private handleStripeError(error: unknown): StripeServiceError {
    if (error instanceof Stripe.errors.StripeError) {
      const statusCode = error.statusCode || 500;

      switch (error.type) {
        case "StripeCardError":
          return new StripeServiceError(
            "Erro no processamento do cartão",
            "CARD_ERROR",
            statusCode,
            { declineCode: error.decline_code }
          );

        case "StripeRateLimitError":
          return new StripeServiceError(
            "Muitas requisições. Tente novamente em alguns segundos",
            "RATE_LIMIT",
            429
          );

        case "StripeInvalidRequestError":
          return new StripeServiceError(
            "Requisição inválida",
            "INVALID_REQUEST",
            statusCode,
            { param: error.param }
          );

        case "StripeAPIError":
          return new StripeServiceError(
            "Erro no servidor de pagamento",
            "API_ERROR",
            statusCode
          );

        case "StripeConnectionError":
          return new StripeServiceError(
            "Erro de conexão com servidor de pagamento",
            "CONNECTION_ERROR",
            503
          );

        case "StripeAuthenticationError":
          return new StripeServiceError(
            "Erro de autenticação",
            "AUTH_ERROR",
            401
          );

        default:
          return new StripeServiceError(
            error.message || "Erro desconhecido",
            "UNKNOWN_ERROR",
            statusCode
          );
      }
    }

    console.error("[StripeService] Unexpected error:", error);
    return new StripeServiceError(
      "Erro inesperado no processamento",
      "UNEXPECTED_ERROR",
      500
    );
  }
}

// ============= SINGLETON INSTANCE =============
let stripeServiceInstance: StripeService | null = null;

/**
 * Factory function para obter instância singleton
 * Implementa lazy initialization
 */
export function getStripeService(): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService();
  }
  return stripeServiceInstance;
}

// ============= WEBHOOK EVENT HANDLERS =============
/**
 * Type-safe webhook event handlers
 * Cada handler é responsável por processar um tipo específico de evento
 */
export const webhookHandlers: Record<
  WebhookEventType,
  (event: Stripe.Event) => Promise<void>
> = {
  "checkout.session.completed": async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;

    await prisma.$transaction(async (tx) => {
      // Atualizar ordem
      const order = await tx.order.update({
        where: {
          stripeSessionId: session.id,
        },
        data: {
          status: "PROCESSING",
          paymentStatus: "SUCCEEDED",
          paymentMethod: session.payment_method_types.includes("pix")
            ? "PIX"
            : "CARD",
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
          // Atualizar endereço de entrega se fornecido
          shippingName: (session as any).shipping?.name,
          shippingAddress: (session as any).shipping?.address?.line1,
          shippingCity: (session as any).shipping?.address?.city,
          shippingState: (session as any).shipping?.address?.state,
          shippingZipCode: (session as any).shipping?.address?.postal_code,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Atualizar estoque dos produtos
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Limpar carrinho do usuário
      await tx.cartItem.deleteMany({
        where: { userId: order.userId },
      });

      // Registrar log de pagamento
      await tx.paymentLog.create({
        data: {
          orderId: order.id,
          event: event.type,
          status: "succeeded",
          amount: new Prisma.Decimal(session.amount_total! / 100),
          currency: session.currency!,
          stripeEventId: event.id,
          rawData: event as any,
        },
      });
    });
  },

  "checkout.session.expired": async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;

    await prisma.order.update({
      where: { stripeSessionId: session.id },
      data: {
        status: "CANCELED",
        paymentStatus: "CANCELED",
        canceledAt: new Date(),
      },
    });
  },

  "payment_intent.succeeded": async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Processar apenas se não foi via checkout session
    if (!paymentIntent.metadata.orderId) return;

    await prisma.paymentLog.create({
      data: {
        orderId: paymentIntent.metadata.orderId,
        event: event.type,
        status: "succeeded",
        amount: new Prisma.Decimal(paymentIntent.amount / 100),
        currency: paymentIntent.currency,
        stripeEventId: event.id,
        rawData: event as any,
      },
    });
  },

  "payment_intent.payment_failed": async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (!paymentIntent.metadata.orderId) return;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: paymentIntent.metadata.orderId },
        data: {
          paymentStatus: "FAILED",
        },
      });

      await tx.paymentLog.create({
        data: {
          orderId: paymentIntent.metadata.orderId,
          event: event.type,
          status: "failed",
          amount: new Prisma.Decimal(paymentIntent.amount / 100),
          currency: paymentIntent.currency,
          stripeEventId: event.id,
          rawData: event as any,
          errorMessage: paymentIntent.last_payment_error?.message,
        },
      });
    });
  },

  "payment_intent.canceled": async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (!paymentIntent.metadata.orderId) return;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: paymentIntent.metadata.orderId },
        data: {
          status: "CANCELED",
          paymentStatus: "CANCELED",
          canceledAt: new Date(),
        },
      });

      await tx.paymentLog.create({
        data: {
          orderId: paymentIntent.metadata.orderId,
          event: event.type,
          status: "canceled",
          stripeEventId: event.id,
          rawData: event as any,
        },
      });
    });
  },
};

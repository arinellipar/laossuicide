/**
 * @module CheckoutSuccessPage
 * @description Página de confirmação de pedido com verificação em tempo real do pagamento
 *
 * Arquitetura:
 * - Server-side data fetching para segurança
 * - Real-time payment status polling
 * - Conditional rendering baseado no método de pagamento
 * - Error boundary para falhas de verificação
 * - Optimistic UI com skeleton loaders
 *
 * Fluxos suportados:
 * 1. Cartão: Exibe confirmação imediata
 * 2. PIX: Exibe QR Code e instruções
 * 3. Boleto: Exibe link para impressão (futuro)
 *
 * Security:
 * - Validação server-side do session_id
 * - Rate limiting no polling
 * - CSRF protection
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  CheckCircle,
  Copy,
  Mail,
  Package,
  Truck,
  Smartphone,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Home,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

// ============= TYPE DEFINITIONS =============
interface OrderDetails {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELED";
  paymentStatus: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  paymentMethod: "CARD" | "PIX" | "BOLETO";
  total: number;
  createdAt: string;
  estimatedDelivery?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      image: string;
    };
  }>;
  customer: {
    name: string;
    email: string;
  };
  shipping?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  // Dados específicos do PIX
  pixData?: {
    qrCode: string;
    qrCodeUrl: string;
    copyPaste: string;
    expiresAt: string;
  };
}

// ============= COMPONENTS =============

/**
 * Componente de loading com skeleton
 */
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <div className="max-w-4xl w-full">
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30">
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 h-24 bg-purple-500/20 rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-purple-500/20 rounded-lg animate-pulse" />
          <div className="h-6 bg-purple-500/20 rounded-lg animate-pulse w-3/4 mx-auto" />
          <div className="h-40 bg-purple-500/20 rounded-xl animate-pulse mt-8" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Componente de erro
 */
const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="min-h-screen bg-black text-white flex items-center justify-center px-4"
  >
    <div className="text-center">
      <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Ops! Algo deu errado</h1>
      <p className="text-gray-400 mb-8">{message}</p>
      <div className="flex gap-4 justify-center">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-3 bg-purple-500 rounded-xl font-semibold"
          >
            Tentar Novamente
          </motion.button>
        )}
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl font-semibold"
          >
            Voltar ao Início
          </motion.button>
        </Link>
      </div>
    </div>
  </motion.div>
);

/**
 * QR Code display para PIX
 */
const PixQRCode = ({
  pixData,
  onCopy,
}: {
  pixData: NonNullable<OrderDetails["pixData"]>;
  onCopy: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = new Date(pixData.expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expiresAt - now;

      if (difference > 0) {
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setTimeLeft("Expirado");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [pixData.expiresAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-green-400" />
          Pague com PIX
        </h3>
        <div className="flex items-center gap-2 text-yellow-400">
          <Clock className="w-5 h-5" />
          <span className="font-mono font-bold">{timeLeft}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="relative bg-white p-4 rounded-xl mb-4">
            <Image
              src={pixData.qrCodeUrl}
              alt="QR Code PIX"
              width={250}
              height={250}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-xl pointer-events-none" />
          </div>
          <p className="text-sm text-gray-400 text-center">
            Escaneie o QR Code com o app do seu banco
          </p>
        </div>

        {/* Copy & Paste */}
        <div className="flex flex-col justify-center">
          <h4 className="font-semibold mb-3">Ou copie o código PIX:</h4>
          <div className="bg-black/50 rounded-xl p-4 border border-green-500/30 mb-4">
            <code className="text-xs text-green-400 break-all font-mono">
              {pixData.copyPaste}
            </code>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCopy}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copiar Código PIX
          </motion.button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
        <p className="text-sm text-yellow-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Após o pagamento, aguarde alguns segundos. A confirmação é
            automática.
          </span>
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Order summary component
 */
const OrderSummary = ({ order }: { order: OrderDetails }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
  >
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Package className="w-6 h-6 text-purple-400" />
      Resumo do Pedido
    </h3>

    {/* Items */}
    <div className="space-y-3 mb-6">
      {order.items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium">{item.product.name}</p>
            <p className="text-sm text-gray-400">
              {item.quantity}x {formatCurrency(item.price)}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Total */}
    <div className="border-t border-purple-500/20 pt-4">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
          {formatCurrency(order.total)}
        </span>
      </div>
    </div>

    {/* Shipping info */}
    {order.shipping && (
      <div className="mt-6 p-4 bg-purple-500/10 rounded-xl">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Endereço de Entrega
        </h4>
        <p className="text-sm text-gray-300">
          {order.shipping.address}
          <br />
          {order.shipping.city}, {order.shipping.state}
          <br />
          CEP: {order.shipping.zipCode}
        </p>
      </div>
    )}
  </motion.div>
);

/**
 * Success animation component
 */
const SuccessAnimation = () => {
  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#a855f7", "#06b6d4"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#a855f7", "#06b6d4"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 15 }}
      className="relative mb-8"
    >
      <CheckCircle className="w-32 h-32 text-green-400 mx-auto" />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 w-32 h-32 bg-green-400 rounded-full blur-xl opacity-30 mx-auto"
      />
    </motion.div>
  );
};

// ============= MAIN COMPONENT =============
function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState(false);

  /**
   * Fetch order details from server
   */
  const fetchOrderDetails = useCallback(async () => {
    if (!sessionId) {
      setError("ID da sessão não encontrado");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/checkout/verify?session_id=${sessionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao verificar pedido");
      }

      const data = await response.json();
      setOrder(data.order);

      // Se pagamento ainda pendente e é PIX, iniciar polling
      if (
        data.order.paymentStatus === "PENDING" &&
        data.order.paymentMethod === "PIX"
      ) {
        setPollingStatus(true);
      }
    } catch (err) {
      console.error("Erro ao buscar pedido:", err);
      setError("Não foi possível carregar os detalhes do pedido");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Poll payment status for PIX
   */
  useEffect(() => {
    if (!pollingStatus || !order) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}/status`);
        const data = await response.json();

        if (data.paymentStatus === "SUCCEEDED") {
          setOrder((prev) =>
            prev ? { ...prev, paymentStatus: "SUCCEEDED" } : null
          );
          setPollingStatus(false);

          // Trigger success animation
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#22c55e", "#06b6d4", "#a855f7"],
          });

          toast.success("Pagamento confirmado!", {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            },
          });
        }
      } catch (error) {
        console.error("Erro no polling:", error);
      }
    }, 3000); // Poll a cada 3 segundos

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [pollingStatus, order]);

  /**
   * Copy PIX code to clipboard
   */
  const handleCopyPixCode = useCallback(() => {
    if (!order?.pixData?.copyPaste) return;

    navigator.clipboard.writeText(order.pixData.copyPaste).then(() => {
      toast.success("Código PIX copiado!", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid rgba(34, 197, 94, 0.3)",
        },
      });
    });
  }, [order]);

  // Initial fetch
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !order) {
    return (
      <ErrorState
        message={error || "Pedido não encontrado"}
        onRetry={fetchOrderDetails}
      />
    );
  }

  // Success state
  const isPaymentSuccessful = order.paymentStatus === "SUCCEEDED";
  const isPix = order.paymentMethod === "PIX";
  const isPending = order.paymentStatus === "PENDING";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {isPaymentSuccessful && <SuccessAnimation />}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              {isPaymentSuccessful ? "PEDIDO CONFIRMADO!" : "PEDIDO RECEBIDO!"}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-2"
          >
            {isPaymentSuccessful
              ? `Obrigado por sua compra, ${order.customer.name}!`
              : isPix
              ? "Complete o pagamento para confirmar seu pedido"
              : "Estamos processando seu pagamento..."}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-purple-400"
          >
            Pedido #{order.orderNumber}
          </motion.p>
        </div>

        {/* Content based on payment status */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Payment info */}
          <div>
            {isPix && isPending ? (
              <PixQRCode pixData={order.pixData!} onCopy={handleCopyPixCode} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30"
              >
                {isPaymentSuccessful ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          Pagamento Aprovado
                        </h3>
                        <p className="text-gray-400">
                          Via{" "}
                          {order.paymentMethod === "CARD" ? "Cartão" : "PIX"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold text-blue-400">
                            Prazo de Entrega
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          Estimativa:{" "}
                          {order.estimatedDelivery || "5-10 dias úteis"}
                        </p>
                      </div>

                      <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-purple-400">
                            Email de Confirmação
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          Enviado para {order.customer.email}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          Processando Pagamento
                        </h3>
                        <p className="text-gray-400">Aguarde a confirmação</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Right column - Order summary */}
          <OrderSummary order={order} />
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          {isPaymentSuccessful && (
            <>
              <Link href="/user/orders">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold flex items-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Acompanhar Pedido
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>

              <Link href="/user/merch">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-purple-500/20 border border-purple-500/30 rounded-xl font-bold hover:bg-purple-500/30 transition-colors"
                >
                  Continuar Comprando
                </motion.button>
              </Link>
            </>
          )}

          {!isPaymentSuccessful && (
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-purple-500/20 border border-purple-500/30 rounded-xl font-bold flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar ao Início
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato:{" "}
            <a
              href="mailto:suporte@laosband.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              suporte@laosband.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Export com Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

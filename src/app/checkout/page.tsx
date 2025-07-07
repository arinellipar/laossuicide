/**
 * @module CheckoutPage
 * @description Página de checkout com integração Stripe Elements
 *
 * Features implementadas:
 * - Stripe Elements para pagamento seguro (PCI compliant)
 * - Suporte para Cartão e PIX
 * - Formulário de endereço com auto-complete de CEP
 * - Resumo do pedido em tempo real
 * - Validação de formulário com React Hook Form
 * - Estados de loading e erro
 * - Design cyberpunk consistente com LAOS
 *
 * Segurança:
 * - Tokenização de cartão no client-side
 * - Sem armazenamento de dados sensíveis
 * - HTTPS enforced
 * - Content Security Policy
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Smartphone,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle,
  MapPin,
  User,
  Truck,
  Shield,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";

// ============= STRIPE CONFIGURATION =============
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ============= VALIDATION SCHEMAS =============
const checkoutSchema = z.object({
  // Informações pessoais
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido"),

  // Endereço de entrega
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),

  // Método de pagamento
  paymentMethod: z.enum(["card", "pix"], {
    errorMap: () => ({ message: "Selecione um método de pagamento" }),
  }),

  // Termos
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos e condições",
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ============= INTERFACES =============
interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// ============= HELPER FUNCTIONS =============
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7
    )}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
    7,
    11
  )}`;
};

// ============= CEP API SERVICE =============
async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, "");
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}

// ============= STRIPE CARD ELEMENT STYLES =============
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: '"Space Grotesk", sans-serif',
      "::placeholder": {
        color: "#6b7280",
      },
      iconColor: "#ec4899",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true, // Já coletamos no formulário
};

// ============= PAYMENT METHOD SELECTOR =============
interface PaymentMethodSelectorProps {
  value: "card" | "pix";
  onChange: (value: "card" | "pix") => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
}) => {
  const methods = [
    {
      id: "card",
      name: "Cartão",
      description: "Crédito ou Débito",
      icon: CreditCard,
      gradient: "from-pink-500 to-purple-500",
    },
    {
      id: "pix",
      name: "PIX",
      description: "Aprovação instantânea",
      icon: Smartphone,
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {methods.map((method) => (
        <motion.button
          key={method.id}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(method.id as "card" | "pix")}
          className={`relative p-6 rounded-2xl border-2 transition-all ${
            value === method.id
              ? "border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20"
              : "border-purple-500/30 bg-black/40 hover:border-purple-500/50"
          }`}
        >
          {value === method.id && (
            <motion.div
              layoutId="payment-method-indicator"
              className="absolute -top-3 -right-3"
              initial={false}
            >
              <div className="relative">
                <CheckCircle className="w-8 h-8 text-pink-500 fill-pink-500" />
                <div className="absolute inset-0 blur-xl bg-pink-500" />
              </div>
            </motion.div>
          )}

          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${method.gradient} p-3 mx-auto mb-3`}
          >
            <method.icon className="w-full h-full text-white" />
          </div>

          <h3 className="font-bold text-lg mb-1">{method.name}</h3>
          <p className="text-sm text-gray-400">{method.description}</p>
        </motion.button>
      ))}
    </div>
  );
};

// ============= CHECKOUT FORM COMPONENT =============
interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit }) => {
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "card",
      acceptTerms: false,
    },
  });

  const watchPaymentMethod = watch("paymentMethod");
  const watchCEP = watch("zipCode");

  // Auto-fetch address by CEP
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanCEP = watchCEP?.replace(/\D/g, "");
      if (cleanCEP?.length === 8) {
        setIsLoadingCEP(true);
        const address = await fetchAddressByCEP(cleanCEP);
        setIsLoadingCEP(false);

        if (address && !address.erro) {
          setValue("address", address.logradouro);
          setValue("neighborhood", address.bairro);
          setValue("city", address.localidade);
          setValue("state", address.uf);

          toast.success("Endereço encontrado!", {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            },
          });
        }
      }
    };

    fetchAddress();
  }, [watchCEP, setValue]);

  const onFormSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);

    try {
      if (data.paymentMethod === "card") {
        if (!stripe || !elements) {
          throw new Error("Stripe não carregado");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Elemento de cartão não encontrado");
        }

        // Validar cartão antes de prosseguir
        const { error: cardError } = await stripe.createToken(cardElement);
        if (cardError) {
          throw new Error(cardError.message);
        }
      }

      await onSubmit(data);
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar pagamento"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Informações Pessoais */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-pink-500" />
          Informações Pessoais
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome Completo
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
              placeholder="Seu nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input
                {...register("phone")}
                onChange={(e) => {
                  e.target.value = formatPhone(e.target.value);
                }}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="(11) 98765-4321"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endereço de Entrega */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-500" />
          Endereço de Entrega
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">CEP</label>
              <div className="relative">
                <input
                  {...register("zipCode")}
                  onChange={(e) => {
                    e.target.value = formatCEP(e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all pr-10"
                  placeholder="12345-678"
                  maxLength={9}
                />
                {isLoadingCEP && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-purple-500" />
                )}
              </div>
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.zipCode.message}
                </p>
              )}
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-block"
              >
                Não sei meu CEP
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-2">Endereço</label>
              <input
                {...register("address")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="Rua, Avenida, etc."
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Número</label>
              <input
                {...register("number")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="123"
              />
              {errors.number && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.number.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Complemento
              </label>
              <input
                {...register("complement")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="Apto, Bloco, etc. (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bairro</label>
              <input
                {...register("neighborhood")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="Seu bairro"
              />
              {errors.neighborhood && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.neighborhood.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <input
                {...register("city")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="Sua cidade"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <input
                {...register("state")}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                placeholder="SP"
                maxLength={2}
                style={{ textTransform: "uppercase" }}
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Método de Pagamento */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-500" />
          Método de Pagamento
        </h2>

        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <PaymentMethodSelector
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {/* Card Element */}
        {watchPaymentMethod === "card" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <label className="block text-sm font-medium mb-2">
              Dados do Cartão
            </label>
            <div className="p-4 bg-black/50 rounded-xl border border-purple-500/30 focus-within:border-pink-500/50 transition-all">
              <CardElement options={cardElementOptions} />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Seus dados estão seguros e criptografados
            </p>
          </motion.div>
        )}

        {/* PIX Info */}
        {watchPaymentMethod === "pix" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/30"
          >
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm text-green-400 font-medium mb-1">
                  Pagamento via PIX
                </p>
                <p className="text-xs text-gray-400">
                  Após confirmar o pedido, você receberá um QR Code para
                  pagamento. O prazo para pagamento é de 30 minutos.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Termos e Condições */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            {...register("acceptTerms")}
            type="checkbox"
            className="mt-1 w-5 h-5 rounded border-purple-500/30 bg-black/50 text-pink-500 focus:ring-pink-500/20"
          />
          <div>
            <p className="text-sm">
              Li e aceito os{" "}
              <Link
                href="/terms"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Termos e Condições
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacy"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Política de Privacidade
              </Link>
            </p>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-400">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isProcessing || !stripe}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Finalizar Pedido
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </form>
  );
};

// ============= ORDER SUMMARY COMPONENT =============
interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    image: string;
    price: number | string;
  };
}

interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  summary: OrderSummary;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, summary }) => {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 lg:sticky lg:top-6">
      <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

      {/* Items */}
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium line-clamp-1">
                {item.product.name}
              </h4>
              <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
              <p className="text-sm font-semibold text-pink-400">
                {formatCurrency(Number(item.product.price) * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="space-y-3 border-t border-purple-500/20 pt-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Impostos</span>
          <span>{formatCurrency(summary.tax)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Frete
          </span>
          <span className={summary.shipping === 0 ? "text-green-400" : ""}>
            {summary.shipping === 0
              ? "Grátis"
              : formatCurrency(summary.shipping)}
          </span>
        </div>
        <div className="border-t border-purple-500/20 pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              {formatCurrency(summary.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="mt-6 pt-6 border-t border-purple-500/20">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Pagamento Seguro
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Checkout Rápido
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MAIN CHECKOUT PAGE =============
export default function CheckoutPage() {
  const router = useRouter();
  const { items, summary, isEmpty } = useCart();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isEmpty) return;

    const timer = setTimeout(() => {
      toast.error("Seu carrinho está vazio");
      router.push("/user/merch");
    }, 1000);

    return () => clearTimeout(timer);
  }, [isEmpty, router]);

  const handleCheckout = async (formData: CheckoutFormData) => {
    setIsCreatingSession(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: formData.paymentMethod,
          shipping: {
            name: formData.name,
            address: `${formData.address}, ${formData.number}${
              formData.complement ? ` - ${formData.complement}` : ""
            }`,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            phone: formData.phone,
          },
          metadata: {
            source: "web",
            email: formData.email,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar sessão de checkout");
      }

      const { data } = await response.json();

      // Redirecionar para Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar checkout"
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-pink-500" />
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                LAOS
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Checkout Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Back button */}
        <Link
          href="/user/merch"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à loja
        </Link>

        <h1 className="text-3xl md:text-4xl font-black mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            Finalizar Pedido
          </span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Elements stripe={stripePromise}>
              <CheckoutForm onSubmit={handleCheckout} />
            </Elements>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary
              items={items.map((item) => ({
                ...item,
                product: {
                  ...item.product,
                  price:
                    typeof item.product.price === "object" &&
                    item.product.price !== null &&
                    typeof item.product.price.toNumber === "function"
                      ? item.product.price.toNumber()
                      : typeof item.product.price === "object" &&
                        item.product.price !== null &&
                        typeof item.product.price.valueOf === "function"
                      ? Number(item.product.price.valueOf())
                      : typeof item.product.price === "string"
                      ? item.product.price
                      : Number(item.product.price),
                },
              }))}
              summary={summary}
            />
          </div>
        </div>
      </main>

      {/* Loading overlay */}
      {isCreatingSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 rounded-2xl p-8 border border-purple-500/30 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              Preparando seu checkout...
            </p>
            <p className="text-sm text-gray-400">
              Você será redirecionado em instantes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

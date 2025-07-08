/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */
/**
 * @module utils
 * @description Biblioteca centralizada de funções utilitárias para o projeto LAOS
 *
 * Arquitetura:
 * - Pure Functions para garantir predictability
 * - Type Guards para runtime type safety
 * - Memoization para funções computacionalmente intensivas
 * - Error Boundaries para handling gracioso de exceções
 *
 * Performance Considerations:
 * - O(1) complexity para operações de formatação
 * - Lazy evaluation onde aplicável
 * - Cache LRU para funções memoizadas
 *
 * @example
 * ```typescript
 * import { formatCurrency, parseDate, slugify } from '@/lib/utils';
 *
 * const price = formatCurrency(1234.56); // "R$ 1.234,56"
 * const slug = slugify("Cyber Rebellion Album"); // "cyber-rebellion-album"
 * ```
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============= CONSTANTS =============
/**
 * Configurações globais para formatação e validação
 * Centralizadas para manutenibilidade
 */
const LOCALE_CONFIG = {
  DEFAULT: "pt-BR",
  FALLBACK: "en-US",
  TIMEZONE: "America/Sao_Paulo",
} as const;

const CURRENCY_CONFIG = {
  CODE: "BRL",
  SYMBOL: "R$",
  DECIMAL_PLACES: 2,
} as const;

const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_BR: /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/,
  CEP: /^\d{5}-?\d{3}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ============= TYPE DEFINITIONS =============
/**
 * Tipos utilitários para type safety aprimorado
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ============= FORMATTING FUNCTIONS =============

/**
 * Formata valor numérico para moeda brasileira (BRL)
 *
 * @param value - Valor a ser formatado (number, string, ou Decimal)
 * @param options - Opções de formatação customizadas
 * @returns String formatada em BRL
 *
 * @complexity O(1)
 * @pure true
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency("1234.56") // "R$ 1.234,56"
 * formatCurrency(1234.5, { minimumFractionDigits: 2 }) // "R$ 1.234,50"
 * formatCurrency(0) // "R$ 0,00"
 * formatCurrency(-1234.56) // "-R$ 1.234,56"
 * ```
 */
export function formatCurrency(
  value: number | string | { toString(): string },
  options?: Intl.NumberFormatOptions
): string {
  try {
    // Type coercion com validação
    const numericValue =
      typeof value === "number"
        ? value
        : typeof value === "string"
        ? parseFloat(value)
        : parseFloat(value.toString());

    // Validação de NaN
    if (isNaN(numericValue)) {
      console.warn(`[formatCurrency] Invalid value: ${value}`);
      return `${CURRENCY_CONFIG.SYMBOL} 0,00`;
    }

    // Formatter com cache interno do Intl
    const formatter = new Intl.NumberFormat(LOCALE_CONFIG.DEFAULT, {
      style: "currency",
      currency: CURRENCY_CONFIG.CODE,
      minimumFractionDigits: CURRENCY_CONFIG.DECIMAL_PLACES,
      maximumFractionDigits: CURRENCY_CONFIG.DECIMAL_PLACES,
      ...options,
    });

    return formatter.format(numericValue);
  } catch (error) {
    console.error("[formatCurrency] Formatting error:", error);
    return `${CURRENCY_CONFIG.SYMBOL} 0,00`;
  }
}

/**
 * Formata data usando Intl.DateTimeFormat com suporte a timezone
 *
 * @param date - Data a ser formatada
 * @param format - Formato predefinido ou options customizadas
 * @returns String formatada
 *
 * @complexity O(1)
 * @memoized true (via Intl cache)
 */
export function formatDate(
  date: Date | string | number,
  format:
    | "short"
    | "medium"
    | "long"
    | "full"
    | Intl.DateTimeFormatOptions = "medium"
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }

    const options: Intl.DateTimeFormatOptions =
      typeof format === "string" ? getDateFormatOptions(format) : format;

    return new Intl.DateTimeFormat(LOCALE_CONFIG.DEFAULT, {
      timeZone: LOCALE_CONFIG.TIMEZONE,
      ...options,
    }).format(dateObj);
  } catch (error) {
    console.error("[formatDate] Formatting error:", error);
    return "Data inválida";
  }
}

/**
 * Helper para obter opções de formatação de data predefinidas
 */
function getDateFormatOptions(
  format: "short" | "medium" | "long" | "full"
): Intl.DateTimeFormatOptions {
  const formats: Record<typeof format, Intl.DateTimeFormatOptions> = {
    short: { day: "2-digit", month: "2-digit", year: "numeric" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { day: "numeric", month: "long", year: "numeric" },
    full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  };
  return formats[format];
}

/**
 * Formata data relativa (e.g., "há 2 dias", "em 3 horas")
 * Utiliza Intl.RelativeTimeFormat para localização precisa
 *
 * @complexity O(1)
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (dateObj.getTime() - now.getTime()) / 1000
    );

    const rtf = new Intl.RelativeTimeFormat(LOCALE_CONFIG.DEFAULT, {
      numeric: "auto",
    });

    // Determinar unidade apropriada
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ["year", 60 * 60 * 24 * 365],
      ["month", 60 * 60 * 24 * 30],
      ["week", 60 * 60 * 24 * 7],
      ["day", 60 * 60 * 24],
      ["hour", 60 * 60],
      ["minute", 60],
      ["second", 1],
    ];

    for (const [unit, secondsInUnit] of units) {
      if (Math.abs(diffInSeconds) >= secondsInUnit) {
        return rtf.format(Math.round(diffInSeconds / secondsInUnit), unit);
      }
    }

    return rtf.format(0, "second");
  } catch (error) {
    console.error("[formatRelativeTime] Error:", error);
    return "";
  }
}

/**
 * Formata número com separadores de milhares
 *
 * @complexity O(1)
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(LOCALE_CONFIG.DEFAULT, options).format(value);
}

/**
 * Formata porcentagem com precisão configurável
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  multiply: boolean = true
): string {
  const percentage = multiply ? value * 100 : value;
  return `${formatNumber(percentage, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

// ============= STRING MANIPULATION =============

/**
 * Cria slug URL-safe a partir de string
 * Implementa normalização Unicode e transliteração
 *
 * @param text - Texto a ser convertido
 * @param options - Opções de configuração
 * @returns Slug normalizado
 *
 * @complexity O(n) onde n = comprimento da string
 *
 * @example
 * ```typescript
 * slugify("Cyber Rebellion Album") // "cyber-rebellion-album"
 * slugify("São Paulo!!!") // "sao-paulo"
 * slugify("LAOS - Last Attempt") // "laos-last-attempt"
 * ```
 */
export function slugify(
  text: string,
  options: {
    lowercase?: boolean;
    separator?: string;
    strict?: boolean;
  } = {}
): string {
  const { lowercase = true, separator = "-", strict = false } = options;

  let slug = text
    .normalize("NFD") // Decomposição Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remove diacríticos
    .trim();

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Substitui caracteres especiais
  slug = slug
    .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
    .replace(/[\s_-]+/g, separator) // Substitui espaços e underscores
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), ""); // Remove separadores no início/fim

  if (strict && !VALIDATION_PATTERNS.SLUG.test(slug)) {
    throw new Error(`Invalid slug format: ${slug}`);
  }

  return slug;
}

/**
 * Trunca string com elipses, respeitando word boundaries
 *
 * @complexity O(n)
 */
export function truncate(
  text: string,
  maxLength: number,
  options: {
    suffix?: string;
    wordBoundary?: boolean;
  } = {}
): string {
  const { suffix = "...", wordBoundary = true } = options;

  if (text.length <= maxLength) return text;

  const truncatedLength = maxLength - suffix.length;
  let truncated = text.substring(0, truncatedLength);

  if (wordBoundary) {
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
  }

  return truncated + suffix;
}

/**
 * Capitaliza primeira letra de cada palavra
 * Handles edge cases como contrações e preposições
 */
export function titleCase(text: string): string {
  const exceptions = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "ou",
    "a",
    "o",
  ]);

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Sempre capitaliza primeira e última palavra
      if (index === 0 || index === text.split(" ").length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Não capitaliza exceções
      if (exceptions.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Remove caracteres HTML perigosos (XSS prevention)
 *
 * @complexity O(n)
 * @security XSS protection
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

/**
 * Remove tags HTML de string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

// ============= VALIDATION FUNCTIONS =============

/**
 * Valida email com regex otimizado
 *
 * @complexity O(1)
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}

/**
 * Valida telefone brasileiro (com ou sem 9º dígito)
 */
export function isValidPhoneBR(phone: string): boolean {
  return VALIDATION_PATTERNS.PHONE_BR.test(phone);
}

/**
 * Valida CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
  return VALIDATION_PATTERNS.CEP.test(cep);
}

/**
 * Valida CPF com algoritmo completo
 * Implementa validação de dígitos verificadores
 *
 * @complexity O(1)
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;

  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;

  // Primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  // Segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
}

/**
 * Valida CNPJ com algoritmo completo
 *
 * @complexity O(1)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length !== 14) return false;

  // Verifica sequências inválidas
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validação similar ao CPF mas com pesos diferentes
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida URL com suporte a protocolos específicos
 */
export function isValidURL(
  url: string,
  protocols: string[] = ["http", "https"]
): boolean {
  try {
    const urlObj = new URL(url);
    return protocols.includes(urlObj.protocol.slice(0, -1));
  } catch {
    return false;
  }
}

// ============= TYPE GUARDS =============

/**
 * Type guard para verificar se valor é não-nulo
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard para verificar se valor é definido
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard para verificar se valor existe (não null/undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard para arrays não vazios
 */
export function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

/**
 * Type guard para strings não vazias
 */
export function isNonEmptyString(str: string): boolean {
  return str.trim().length > 0;
}

// ============= ARRAY UTILITIES =============

/**
 * Remove duplicatas de array mantendo primeira ocorrência
 *
 * @complexity O(n)
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Remove duplicatas por propriedade específica
 *
 * @complexity O(n)
 */
export function uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set<T[K]>();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Agrupa array por propriedade
 *
 * @complexity O(n)
 */
export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Map<T[K], T[]> {
  return array.reduce((map, item) => {
    const group = item[key];
    const collection = map.get(group) || [];
    collection.push(item);
    map.set(group, collection);
    return map;
  }, new Map<T[K], T[]>());
}

/**
 * Divide array em chunks de tamanho específico
 *
 * @complexity O(n)
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be greater than 0");

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Ordena array por múltiplas propriedades
 *
 * @complexity O(n log n)
 */
export function sortBy<T>(
  array: T[],
  ...keys: Array<keyof T | [keyof T, "asc" | "desc"]>
): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const [prop, order] = Array.isArray(key) ? key : [key, "asc"];
      const aVal = (a as Record<string, any>)[prop as string];
      const bVal = (b as Record<string, any>)[prop as string];

      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
    }
    return 0;
  });
}

// ============= OBJECT UTILITIES =============

/**
 * Deep clone de objeto usando structured clone (quando disponível)
 * Fallback para JSON parse/stringify
 *
 * @complexity O(n) onde n = número de propriedades
 */
export function deepClone<T>(obj: T): T {
  // Verifica se structured clone está disponível (Node 17+, browsers modernos)
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }

  // Fallback para JSON (limitações: functions, undefined, symbols)
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge profundo de objetos
 *
 * @complexity O(n)
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as object, source[key] as object);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Pick específicas propriedades de objeto
 *
 * @complexity O(k) onde k = número de keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omit específicas propriedades de objeto
 *
 * @complexity O(n)
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const keysSet = new Set(keys);
  return Object.entries(obj).reduce((result, [key, value]) => {
    if (!keysSet.has(key as K)) {
      result[key as keyof Omit<T, K>] = value;
    }
    return result;
  }, {} as Omit<T, K>);
}

// ============= FUNCTIONAL UTILITIES =============

/**
 * Debounce function com suporte a leading/trailing edge
 *
 * @complexity O(1) por chamada
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let lastArgs: Parameters<T> | null = null;

  const { leading = false, trailing = true, maxWait } = options;

  return function debounced(...args: Parameters<T>) {
    const now = Date.now();

    if (!previous && !leading) previous = now;

    const remaining = wait - (now - previous);

    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        if (lastArgs) func(...lastArgs);
      }, remaining);
    }

    if (maxWait && now - previous > maxWait) {
      if (timeout) clearTimeout(timeout);
      previous = now;
      func(...args);
    }
  };
}

/**
 * Throttle function com garantia de última execução
 *
 * @complexity O(1) por chamada
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;

  const { leading = true, trailing = true } = options;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      if (leading) func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Memoização com cache LRU configurável
 *
 * @complexity O(1) para cache hit, O(n) para cache miss
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  options: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const {
    maxSize = 100,
    ttl = Infinity,
    keyGenerator = (...args) => JSON.stringify(args),
  } = options;

  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      // Move to end (LRU)
      cache.delete(key);
      cache.set(key, cached);
      return cached.value;
    }

    const result = func(...args);

    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === "string") {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;
}

/**
 * Compose functions da direita para esquerda
 *
 * @complexity O(n) onde n = número de funções
 */
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

/**
 * Pipe functions da esquerda para direita
 *
 * @complexity O(n) onde n = número de funções
 */
export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

// ============= DATE UTILITIES =============

/**
 * Adiciona unidades de tempo a uma data
 */
export function addTime(
  date: Date,
  amount: number,
  unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
): Date {
  const result = new Date(date);

  switch (unit) {
    case "seconds":
      result.setSeconds(result.getSeconds() + amount);
      break;
    case "minutes":
      result.setMinutes(result.getMinutes() + amount);
      break;
    case "hours":
      result.setHours(result.getHours() + amount);
      break;
    case "days":
      result.setDate(result.getDate() + amount);
      break;
    case "weeks":
      result.setDate(result.getDate() + amount * 7);
      break;
    case "months":
      result.setMonth(result.getMonth() + amount);
      break;
    case "years":
      result.setFullYear(result.getFullYear() + amount);
      break;
  }

  return result;
}

/**
 * Verifica se data está entre intervalo
 */
export function isDateBetween(
  date: Date,
  start: Date,
  end: Date,
  inclusive: boolean = true
): boolean {
  const time = date.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();

  return inclusive
    ? time >= startTime && time <= endTime
    : time > startTime && time < endTime;
}

/**
 * Calcula diferença entre datas em unidade específica
 */
export function dateDiff(
  date1: Date,
  date2: Date,
  unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
): number {
  const diff = Math.abs(date1.getTime() - date2.getTime());

  switch (unit) {
    case "seconds":
      return Math.floor(diff / 1000);
    case "minutes":
      return Math.floor(diff / (1000 * 60));
    case "hours":
      return Math.floor(diff / (1000 * 60 * 60));
    case "days":
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    case "weeks":
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    case "months":
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44)); // Média
    case "years":
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)); // Considera bissexto
  }
}

// ============= MATH UTILITIES =============

/**
 * Clamp valor entre min e max
 *
 * @complexity O(1)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolação linear
 *
 * @complexity O(1)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Mapeia valor de um range para outro
 *
 * @complexity O(1)
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Arredonda para precisão específica
 *
 * @complexity O(1)
 */
export function roundTo(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Gera número aleatório entre min e max
 *
 * @complexity O(1)
 */
export function randomBetween(
  min: number,
  max: number,
  integer: boolean = false
): number {
  const random = Math.random() * (max - min) + min;
  return integer ? Math.floor(random) : random;
}

// ============= COLOR UTILITIES =============

/**
 * Converte HEX para RGB
 *
 * @complexity O(1)
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converte RGB para HEX
 *
 * @complexity O(1)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = clamp(n, 0, 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calcula luminância relativa de cor
 * Útil para determinar contraste de texto
 *
 * @complexity O(1)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determina se usar texto claro ou escuro baseado na cor de fundo
 *
 * @complexity O(1)
 */
export function getContrastTextColor(
  backgroundColor: string
): "white" | "black" {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "white";

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? "black" : "white";
}

// ============= BROWSER UTILITIES =============

/**
 * Copia texto para clipboard com fallback
 *
 * @complexity O(1)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      return true;
    } finally {
      document.body.removeChild(textArea);
    }
  } catch {
    return false;
  }
}

/**
 * Detecta se está em dispositivo móvel
 *
 * @complexity O(1)
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detecta se está em modo dark
 *
 * @complexity O(1)
 */
export function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Scroll suave para elemento
 *
 * @complexity O(1)
 */
export function scrollToElement(
  element: Element | string,
  options: ScrollIntoViewOptions = { behavior: "smooth", block: "start" }
): void {
  const el =
    typeof element === "string" ? document.querySelector(element) : element;
  el?.scrollIntoView(options);
}

// ============= PERFORMANCE UTILITIES =============

/**
 * Mede performance de função
 *
 * @complexity O(1) overhead
 */
export async function measurePerformance<T>(
  fn: () => T | Promise<T>,
  label: string = "Operation"
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Request Idle Callback com fallback
 *
 * @complexity O(1)
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== "undefined") {
    if ("requestIdleCallback" in window) {
      return window.requestIdleCallback(callback, options);
    }

    // Fallback com setTimeout
    const start = Date.now();
    return (window as Window).setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  } else {
    // SSR fallback: just call the callback synchronously
    callback({
      didTimeout: false,
      timeRemaining: () => 0,
    });
    return 0;
  }
}

// ============= MISC UTILITIES =============

/**
 * Gera UUID v4
 *
 * @complexity O(1)
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gera ID curto único
 *
 * @complexity O(1)
 */
export function generateShortId(length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Sleep/delay assíncrono
 *
 * @complexity O(1)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com exponential backoff
 *
 * @complexity O(n) onde n = número de tentativas
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === retries) break;

      const waitTime = Math.min(delay * Math.pow(factor, attempt), maxDelay);

      onRetry?.(lastError, attempt + 1);
      await sleep(waitTime);
    }
  }

  throw lastError!;
}

// ============= CLASS NAMES UTILITY (TailwindCSS) =============

/**
 * Combina class names com merge de conflitos do Tailwind
 * Utiliza clsx para concatenação e tw-merge para resolução de conflitos
 *
 * @complexity O(n) onde n = número de classes
 *
 * @example
 * ```typescript
 * cn('px-4 py-2', 'px-8') // 'py-2 px-8'
 * cn('text-red-500', condition && 'text-blue-500') // conditional classes
 * cn(['flex', 'gap-4'], { 'opacity-50': isDisabled }) // arrays e objects
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============= TYPE HELPERS =============

/**
 * Helper para verificar se valor é objeto
 */
function isObject(item: any): item is object {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Helper para verificar se valor é função
 */
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function";
}

/**
 * Helper para verificar se valor é Promise
 */
export function isPromise<T = any>(value: any): value is Promise<T> {
  return (
    value instanceof Promise ||
    (value &&
      typeof value.then === "function" &&
      typeof value.catch === "function")
  );
}

// ============= ERROR HANDLING =============

/**
 * Wrapper para try-catch com retorno tipado
 *
 * @complexity O(1)
 */
export async function tryCatch<T, E = Error>(
  fn: () => T | Promise<T>
): Promise<[T, null] | [null, E]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, error as E];
  }
}

/**
 * Assertion helper com mensagem customizada
 */
export function assert(
  condition: any,
  message: string = "Assertion failed"
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Invariant check (similar ao assert mas para condições que nunca devem ocorrer)
 */
export function invariant(
  condition: any,
  message: string = "Invariant violation"
): asserts condition {
  if (!condition) {
    throw new Error(`[INVARIANT] ${message}`);
  }
}

// ============= ENVIRONMENT UTILITIES =============

/**
 * Verifica se está rodando no servidor (SSR)
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Verifica se está rodando no cliente
 */
export function isClient(): boolean {
  return !isServer();
}

/**
 * Verifica se está em desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Verifica se está em produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// ============= EXPORT AGGREGATION =============

// Re-export tipos úteis de outras libs
export type { ClassValue } from "clsx";

// Default export com todas as funções (tree-shakeable)
export default {
  // Formatting
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,

  // String
  slugify,
  truncate,
  titleCase,
  escapeHtml,
  stripHtml,

  // Validation
  isValidEmail,
  isValidPhoneBR,
  isValidCEP,
  isValidCPF,
  isValidCNPJ,
  isValidURL,

  // Type Guards
  isNotNull,
  isDefined,
  exists,
  isNonEmptyArray,
  isNonEmptyString,

  // Arrays
  unique,
  uniqueBy,
  groupBy,
  chunk,
  sortBy,

  // Objects
  deepClone,
  deepMerge,
  pick,
  omit,

  // Functions
  debounce,
  throttle,
  memoize,
  compose,
  pipe,

  // Date
  addTime,
  isDateBetween,
  dateDiff,

  // Math
  clamp,
  lerp,
  mapRange,
  roundTo,
  randomBetween,

  // Color
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastTextColor,

  // Browser
  copyToClipboard,
  isMobile,
  isDarkMode,
  scrollToElement,

  // Performance
  measurePerformance,
  requestIdleCallback,

  // Misc
  generateUUID,
  generateShortId,
  sleep,
  retry,
  cn,

  // Type Helpers
  isObject,
  isFunction,
  isPromise,

  // Error Handling
  tryCatch,
  assert,
  invariant,

  // Environment
  isServer,
  isClient,
  isDevelopment,
  isProduction,
};

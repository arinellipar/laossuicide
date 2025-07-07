/**
 * @module useDebounce
 * @description Hook para debouncing de valores com TypeScript
 *
 * Utilizado para:
 * - Reduzir chamadas de API durante digitação
 * - Otimizar updates de estado caros
 * - Melhorar performance em inputs de busca
 * - Evitar múltiplas requisições em componentes controlados
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Executar busca apenas após 500ms sem alterações
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */

import { useState, useEffect, useRef } from "react";

/**
 * Hook que retorna uma versão debounced do valor fornecido
 * O valor debounced só será atualizado após o delay especificado
 * sem que o valor original mude
 *
 * @param value - O valor a ser debounced
 * @param delay - O tempo de delay em milissegundos
 * @returns O valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timer anterior se existir
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Se delay for 0, atualizar imediatamente
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    // Configurar novo timer
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  // Limpar timer ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Hook que retorna uma função debounced
 * Útil quando você precisa debounce callbacks ao invés de valores
 *
 * @param callback - A função a ser debounced
 * @param delay - O tempo de delay em milissegundos
 * @returns A função debounced
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   (value: string) => {
 *     saveToAPI(value);
 *   },
 *   1000
 * );
 *
 * // Em onChange do input
 * onChange={(e) => debouncedSave(e.target.value)}
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Atualizar ref do callback para evitar closures antigas
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useRef((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }).current;
}

/**
 * Hook que retorna tanto o valor debounced quanto um indicador de loading
 * Útil para mostrar estados de loading durante o debounce
 *
 * @param value - O valor a ser debounced
 * @param delay - O tempo de delay em milissegundos
 * @returns Tupla com [valorDebounced, isDebouncing]
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const [debouncedTerm, isDebouncing] = useDebouncedValue(searchTerm, 500);
 *
 * return (
 *   <div>
 *     <input onChange={(e) => setSearchTerm(e.target.value)} />
 *     {isDebouncing && <Spinner />}
 *   </div>
 * );
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Se valor mudou, estamos debouncing
    setIsDebouncing(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsDebouncing(false);
    };
  }, []);

  return [debouncedValue, isDebouncing];
}

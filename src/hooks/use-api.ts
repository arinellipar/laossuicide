// src/hooks/use-api.ts
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Generic API response type
 */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for API calls with loading and error states
 */
export function useApi<T>(url: string, options?: RequestInit): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

/**
 * Custom hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<TData = any, TVariables = any>(
  url: string,
  options?: RequestInit
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (variables?: TVariables): Promise<TData | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          method: "POST",
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          body: variables ? JSON.stringify(variables) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, options]
  );

  return {
    mutate,
    loading,
    error,
    reset: () => setError(null),
  };
}

// src/hooks/useFavorites.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// ============= API CLIENT =============
class FavoritesAPI {
  static async getFavorites(): Promise<string[]> {
    const response = await fetch("/api/favorites");
    if (!response.ok) {
      throw new Error("Failed to fetch favorites");
    }
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((fav: any) => fav.productId);
  }

  static async addFavorite(productId: string): Promise<void> {
    const response = await fetch(`/api/favorites/${productId}`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to add favorite");
    }
  }

  static async removeFavorite(productId: string): Promise<void> {
    const response = await fetch(`/api/favorites/${productId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to remove favorite");
    }
  }
}

// ============= QUERY KEYS =============
const QUERY_KEYS = {
  favorites: ["favorites"],
} as const;

// ============= HOOK =============
export function useFavorites() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: FavoritesAPI.getFavorites,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addMutation = useMutation({
    mutationFn: FavoritesAPI.addFavorite,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favorites });
      const previousFavorites = queryClient.getQueryData<string[]>(
        QUERY_KEYS.favorites
      );

      queryClient.setQueryData<string[]>(QUERY_KEYS.favorites, (old = []) => [
        ...old,
        productId,
      ]);

      return { previousFavorites };
    },
    onError: (err, productId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          QUERY_KEYS.favorites,
          context.previousFavorites
        );
      }
      toast.error("Erro ao adicionar aos favoritos");
    },
    onSuccess: () => {
      toast.success("Adicionado aos favoritos!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
    },
  });

  const removeMutation = useMutation({
    mutationFn: FavoritesAPI.removeFavorite,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favorites });
      const previousFavorites = queryClient.getQueryData<string[]>(
        QUERY_KEYS.favorites
      );

      queryClient.setQueryData<string[]>(QUERY_KEYS.favorites, (old = []) =>
        old.filter((id) => id !== productId)
      );

      return { previousFavorites };
    },
    onError: (err, productId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          QUERY_KEYS.favorites,
          context.previousFavorites
        );
      }
      toast.error("Erro ao remover dos favoritos");
    },
    onSuccess: () => {
      toast.success("Removido dos favoritos");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
    },
  });

  const toggleFavorite = async (productId: string) => {
    if (favorites.includes(productId)) {
      await removeMutation.mutateAsync(productId);
    } else {
      await addMutation.mutateAsync(productId);
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
  };
}

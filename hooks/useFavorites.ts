'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

interface FavoriteProduct {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Cargar favoritos al iniciar
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Usuario logueado: obtener de la base de datos
        const { data, error } = await supabase
          .from('user_favorites')
          .select('product_id')
          .eq('user_id', session.user.id);

        if (error) throw error;

        const favoriteIds = data.map((fav: any) => fav.product_id);
        setFavorites(favoriteIds);

        // Sincronizar con localStorage si hay datos
        const localFavorites = getLocalFavorites();
        if (localFavorites.length > 0) {
          await syncLocalToDatabase(localFavorites, session.user.id);
        }
      } else {
        // Usuario no logueado: obtener de localStorage
        setFavorites(getLocalFavorites());
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalFavorites = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
  };

  const saveLocalFavorites = (favoriteIds: string[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('favorites', JSON.stringify(favoriteIds));
  };

  const syncLocalToDatabase = async (localFavorites: string[], userId: string) => {
    try {
      // Insertar favoritos locales en la base de datos
      for (const productId of localFavorites) {
        await supabase
          .from('user_favorites')
          .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
      }

      // Limpiar localStorage después de sincronizar
      localStorage.removeItem('favorites');
    } catch (error) {
      console.error('Error syncing favorites:', error);
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isFav = favorites.includes(productId);

      if (session?.user) {
        // Usuario logueado: actualizar base de datos
        if (isFav) {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', session.user.id)
            .eq('product_id', productId);

          if (error) throw error;

          setFavorites(favorites.filter(id => id !== productId));
          toast.success('ELIMINADO DE FAVORITOS');
        } else {
          const { error } = await supabase
            .from('user_favorites')
            .insert({ user_id: session.user.id, product_id: productId });

          if (error) throw error;

          setFavorites([...favorites, productId]);
          toast.success('AGREGADO A FAVORITOS');
        }
      } else {
        // Usuario no logueado: actualizar localStorage
        let newFavorites: string[];
        if (isFav) {
          newFavorites = favorites.filter(id => id !== productId);
          toast.success('ELIMINADO DE FAVORITOS');
        } else {
          newFavorites = [...favorites, productId];
          toast.success('AGREGADO A FAVORITOS');
        }

        setFavorites(newFavorites);
        saveLocalFavorites(newFavorites);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('ERROR AL ACTUALIZAR FAVORITOS');
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.includes(productId);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    reloadFavorites: loadFavorites
  };
}

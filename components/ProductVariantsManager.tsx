'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Variant {
  id: string;
  sku: string;
  size: string;
  color?: string;
  stock: number;
}

interface ProductVariantsManagerProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ProductVariantsManager({ 
  productId, 
  productName, 
  onClose 
}: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Formulario para nueva variante
  const [newVariant, setNewVariant] = useState({
    sku: '',
    size: '',
    color: '',
    stock: 0,
  });

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size');

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariant.size.trim()) {
      alert('El talle es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('product_variants')
        .insert([{
          product_id: productId,
          sku: newVariant.sku.trim() || null,
          size: newVariant.size.trim().toUpperCase(),
          color: newVariant.color.trim() || null,
          stock: newVariant.stock,
        }]);

      if (error) throw error;

      // Limpiar formulario
      setNewVariant({ sku: '', size: '', color: '', stock: 0 });
      
      // Recargar variantes
      await loadVariants();
      alert('✅ Variante agregada exitosamente');
    } catch (error: any) {
      console.error('Error adding variant:', error);
      if (error.code === '23505') {
        alert('❌ Ya existe una variante con ese SKU');
      } else {
        alert('❌ Error al agregar variante');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId);

      if (error) throw error;

      // Actualizar localmente
      setVariants(variants.map(v => 
        v.id === variantId ? { ...v, stock: newStock } : v
      ));
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error al actualizar stock');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('¿Eliminar esta variante?')) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      await loadVariants();
      alert('✅ Variante eliminada');
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Error al eliminar variante');
    }
  };

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Variantes de Producto
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {productName} • Stock Total: {totalStock} unidades
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Formulario para agregar nueva variante */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              ➕ Agregar Nueva Variante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Talle *
                </label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                  placeholder="XS, S, M, L, XL"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  SKU (opcional)
                </label>
                <input
                  type="text"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                  placeholder="REM-001-XL"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Stock Inicial *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddVariant}
                  disabled={saving || !newVariant.size.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white px-4 py-2 rounded font-semibold transition-colors"
                >
                  {saving ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de variantes existentes */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              📦 Variantes Existentes ({variants.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                Cargando variantes...
              </div>
            ) : variants.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                No hay variantes. Agrega la primera variante arriba.
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded font-bold text-lg">
                        {variant.size}
                      </div>
                      <div className="flex-1">
                        {variant.sku && (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            SKU: {variant.sku}
                          </div>
                        )}
                        {variant.color && (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Color: {variant.color}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Stock:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => handleUpdateStock(variant.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-center"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar variante"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

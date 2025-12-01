'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import Image from 'next/image';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
      // Extraer categorías únicas
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category) || []));
      setCategories(uniqueCategories);
    }
    setLoading(false);
  };

  const loadHistory = async (productId: string) => {
    const { data, error } = await supabase
      .from('inventory_history')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading history:', error);
    } else {
      setHistory(data || []);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || adjustment === 0) return;

    const newStock = selectedProduct.stock + adjustment;
    if (newStock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      console.error('Error updating stock:', updateError);
      alert('Error al actualizar stock');
      return;
    }

    // Registrar en historial
    const { error: historyError } = await supabase
      .from('inventory_history')
      .insert({
        product_id: selectedProduct.id,
        change_type: 'manual_adjustment',
        quantity_change: adjustment,
        stock_after: newStock,
        reason: reason || 'Ajuste manual',
      });

    if (historyError) {
      console.error('Error logging history:', historyError);
    }

    // Recargar datos
    await loadProducts();
    await loadHistory(selectedProduct.id);
    
    // Actualizar producto seleccionado
    setSelectedProduct({ ...selectedProduct, stock: newStock });
    setAdjustment(0);
    setReason('');
    
    alert('Stock actualizado correctamente');
  };

  const openModal = async (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
    await loadHistory(product.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setAdjustment(0);
    setReason('');
    setHistory([]);
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesStockFilter = filter === 'all' || (filter === 'low-stock' && p.stock <= 5);
    const matchesCategoryFilter = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesStockFilter && matchesCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Gestión de Inventario</h1>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Filtro de stock */}
            <div>
              <label className="block text-sm font-medium mb-2">Stock</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded ${
                    filter === 'all'
                      ? 'bg-black text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('low-stock')}
                  className={`px-4 py-2 rounded ${
                    filter === 'low-stock'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Stock Bajo (≤5)
                </button>
              </div>
            </div>

            {/* Filtro de categoría */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border rounded"
              >
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Cargando inventario...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-left">Imagen</th>
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-left">Categoría</th>
                  <th className="p-4 text-left">Talle</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={product.images?.[0] || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        ${product.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">{product.size || '-'}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`font-bold text-lg ${
                          product.stock <= 5
                            ? 'text-red-600'
                            : product.stock <= 10
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {product.stock === 0 ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Sin Stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openModal(product)}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay productos que coincidan con los filtros
            </div>
          )}
        </div>
      </div>

      {/* Modal de ajuste de stock */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  <p className="text-gray-600">Stock actual: <span className="font-bold text-xl">{selectedProduct.stock}</span></p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Ajuste de stock */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-bold mb-4">Ajustar Stock</h3>
                
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setAdjustment(adjustment - 1)}
                    className="w-12 h-12 bg-red-600 text-white rounded-full text-2xl font-bold hover:bg-red-700"
                  >
                    -
                  </button>
                  
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                      className="w-full text-center text-2xl font-bold border-2 border-gray-300 rounded p-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Nuevo stock: <span className="font-bold">{selectedProduct.stock + adjustment}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setAdjustment(adjustment + 1)}
                    className="w-12 h-12 bg-green-600 text-white rounded-full text-2xl font-bold hover:bg-green-700"
                  >
                    +
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Ajuste por inventario físico"
                    className="w-full border rounded p-2"
                  />
                </div>

                <button
                  onClick={handleAdjustStock}
                  disabled={adjustment === 0}
                  className="w-full bg-black text-white py-3 rounded font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Aplicar Ajuste
                </button>
              </div>

              {/* Historial */}
              <div>
                <h3 className="font-bold mb-4">Historial de Movimientos</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Sin movimientos registrados</p>
                  ) : (
                    history.map((entry) => (
                      <div key={entry.id} className="border-l-4 border-gray-300 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {entry.change_type === 'manual_adjustment' ? '📝 Ajuste Manual' :
                               entry.change_type === 'sale' ? '🛒 Venta Online' :
                               entry.change_type === 'local_sale' ? '🏪 Venta Local' :
                               entry.change_type}
                            </p>
                            <p className="text-sm text-gray-600">{entry.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${entry.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {entry.stock_after}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(entry.created_at).toLocaleString('es-AR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

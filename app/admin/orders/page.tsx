'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/AdminNav';
import Image from 'next/image';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total: number;
  status: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
    size?: string;
    product_name?: string;
  }[];
  payment_id?: string;
  created_at: string;
}

export default function OrdersPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
      // Actualizar cada 30 segundos
      const interval = setInterval(loadOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, filter]);

  const loadOrders = async () => {
    try {
      console.log('Cargando pedidos...');
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Total de pedidos en BD:', data?.length);
      console.log('Estados únicos:', [...new Set(data?.map(o => o.status))]);
      
      // Filtrar pedidos cancelados DESPUÉS de traer los datos
      let filteredOrders = (data || []).filter(order => order.status !== 'cancelled');
      
      // Aplicar filtro adicional si no es "all"
      if (filter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filter);
      }
      
      console.log('Pedidos después de filtrar cancelados:', filteredOrders.length);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (cancelling) {
      console.log('Ya hay una cancelación en proceso');
      return;
    }
    
    if (!confirm(`¿Estás seguro de cancelar el pedido de ${order.customer_name}?`)) return;

    setCancelling(true);
    try {
      console.log('Cancelando pedido:', order.id);
      
      // Actualizar directamente en Supabase (sin API intermedia)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        throw new Error(`Error al cancelar: ${updateError.message}`);
      }

      console.log('Pedido actualizado a cancelled');

      // Restaurar el stock de cada producto
      for (const item of order.items) {
        console.log(`Restaurando stock para producto ${item.product_id}, cantidad: ${item.quantity}`);
        
        // Incrementar stock directamente
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id);

          if (stockError) {
            console.error(`Error restoring stock for product ${item.product_id}:`, stockError);
          } else {
            console.log(`Stock restaurado para producto ${item.product_id}`);
          }
        }
      }

      // Cerrar el modal primero
      setSelectedOrder(null);
      
      // Recargar la lista de pedidos
      console.log('Recargando lista de pedidos...');
      await loadOrders();
      
      alert('Pedido cancelado y stock restaurado exitosamente');
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert(`Error al cancelar el pedido: ${error.message || 'Error desconocido'}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-zinc-100 text-zinc-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ Pendiente',
      confirmed: '✅ Confirmado',
      shipped: '🚚 Enviado',
      delivered: '📦 Entregado',
      cancelled: '❌ Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              📦 Pedidos Online
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Gestiona las compras realizadas desde la web
            </p>
          </div>
          <button
            onClick={loadOrders}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors relative ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            ⏳ Pendientes
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === 'confirmed'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            ✅ Confirmados
          </button>
          <button
            onClick={() => setFilter('shipped')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === 'shipped'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            🚚 Enviados
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === 'delivered'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            📦 Entregados
          </button>
        </div>

        {/* Lista de Órdenes */}
        {loadingOrders ? (
          <p className="text-center text-zinc-600 dark:text-zinc-400">Cargando órdenes...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              No hay pedidos {filter !== 'all' ? `con estado "${filter}"` : ''}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {order.customer_email}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-white">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Ver detalles
                      </button>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancelling}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling ? 'Procesando...' : 'Cancelar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal de Detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                  Detalle del Pedido
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(selectedOrder.created_at).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Información del Cliente */}
            <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-lg mb-3">Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Nombre</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Teléfono</p>
                  <p className="font-medium">{selectedOrder.customer_phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Dirección de Envío</p>
                  <p className="font-medium">{selectedOrder.shipping_address}</p>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Productos</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name || 'Producto'}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Cantidad: {item.quantity} x ${item.price}
                      </p>
                    </div>
                    <p className="font-bold">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-zinc-200 dark:border-zinc-600 pt-4 mb-6">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>TOTAL:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Estado */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Estado del Pedido</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
              >
                <option value="pending">⏳ Pendiente</option>
                <option value="confirmed">✅ Confirmado</option>
                <option value="shipped">🚚 Enviado</option>
                <option value="delivered">📦 Entregado</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>

            <div className="flex gap-3">
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder)}
                  disabled={cancelling}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? '⏳ Procesando...' : '❌ Cancelar Pedido'}
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

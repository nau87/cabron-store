'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AdminNav from '@/components/AdminNav';

interface LocalSale {
  id: string;
  sale_number: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  payment_method: string;
  created_at: string;
}

interface OnlineOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  payment_id: string;
  created_at: string;
}

type SaleType = 'all' | 'pos' | 'online';
type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function VentasPage() {
  const supabase = createClient();
  
  const [localSales, setLocalSales] = useState<LocalSale[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    loadSales();
  }, [dateFilter]);

  const getDateFilterQuery = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today.toISOString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      default:
        return null;
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const dateFilterValue = getDateFilterQuery();

      // Cargar ventas POS
      let localQuery = supabase
        .from('local_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFilterValue) {
        localQuery = localQuery.gte('created_at', dateFilterValue);
      }

      const { data: localData, error: localError } = await localQuery;

      if (localError) {
        console.error('Error loading local sales:', localError);
      } else {
        setLocalSales(localData || []);
      }

      // Cargar ventas online (solo aprobadas)
      let onlineQuery = supabase
        .from('orders')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (dateFilterValue) {
        onlineQuery = onlineQuery.gte('created_at', dateFilterValue);
      }

      const { data: onlineData, error: onlineError } = await onlineQuery;

      if (onlineError) {
        console.error('Error loading online orders:', onlineError);
      } else {
        setOnlineOrders(onlineData || []);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const filteredLocal = saleTypeFilter === 'online' ? [] : localSales;
    const filteredOnline = saleTypeFilter === 'pos' ? [] : onlineOrders;

    const localTotal = filteredLocal.reduce((sum, sale) => sum + sale.total, 0);
    const onlineTotal = filteredOnline.reduce((sum, order) => sum + order.total, 0);
    const total = localTotal + onlineTotal;

    return {
      localTotal,
      onlineTotal,
      total,
      localCount: filteredLocal.length,
      onlineCount: filteredOnline.length,
      totalCount: filteredLocal.length + filteredOnline.length,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  };

  const totals = calculateTotals();

  const allSales = [
    ...localSales.map(sale => ({ ...sale, type: 'pos' as const })),
    ...onlineOrders.map(order => ({ ...order, type: 'online' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredSales = allSales.filter(sale => {
    if (saleTypeFilter === 'all') return true;
    return sale.type === saleTypeFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">📊 Registro de Ventas</h1>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Ventas</div>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totals.total)}</div>
            <div className="text-xs text-gray-500">{totals.totalCount} ventas</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Ventas POS</div>
            <div className="text-2xl font-bold text-blue-600">{formatPrice(totals.localTotal)}</div>
            <div className="text-xs text-gray-500">{totals.localCount} ventas</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Ventas Online</div>
            <div className="text-2xl font-bold text-purple-600">{formatPrice(totals.onlineTotal)}</div>
            <div className="text-xs text-gray-500">{totals.onlineCount} ventas</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Ticket Promedio</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatPrice(totals.totalCount > 0 ? totals.total / totals.totalCount : 0)}
            </div>
            <div className="text-xs text-gray-500">por venta</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Venta
              </label>
              <select
                value={saleTypeFilter}
                onChange={(e) => setSaleTypeFilter(e.target.value as SaleType)}
                className="border rounded px-3 py-2"
              >
                <option value="all">Todas</option>
                <option value="pos">POS</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="border rounded px-3 py-2"
              >
                <option value="all">Todo</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadSales}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de ventas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Cargando ventas...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay ventas para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº Venta / Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={`${sale.type}-${sale.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.type === 'pos' ? (
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            🏪 POS
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                            🌐 Online
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.type === 'pos' 
                          ? (sale as LocalSale).sale_number 
                          : (sale as OnlineOrder).customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.type === 'pos' 
                          ? (sale as LocalSale).payment_method 
                          : 'Mercado Pago'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatPrice(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

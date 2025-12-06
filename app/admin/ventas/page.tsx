'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface LocalSale {
  id: string;
  sale_number: string;
  customer_name: string;
  receipt_data?: any;
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
  receipt_data?: any;
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

type SaleType = 'all' | 'pos' | 'online' | 'cuenta_corriente';
type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function VentasPage() {
  const [localSales, setLocalSales] = useState<LocalSale[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedSale, setSelectedSale] = useState<(LocalSale & { type: 'pos' }) | (OnlineOrder & { type: 'online' }) | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        .from('sales')
        .select('*')
        .eq('sale_type', 'pos')
        .order('created_at', { ascending: false });

      if (dateFilterValue) {
        localQuery = localQuery.gte('created_at', dateFilterValue);
      }

      const { data: localData, error: localError } = await localQuery;

      if (localError) {
        console.error('Error loading POS sales:', localError);
      } else {
        setLocalSales(localData || []);
      }

      // Cargar ventas online (solo aprobadas)
      let onlineQuery = supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'online')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (dateFilterValue) {
        onlineQuery = onlineQuery.gte('created_at', dateFilterValue);
      }

      const { data: onlineData, error: onlineError } = await onlineQuery;

      if (onlineError) {
        console.error('Error loading online sales:', onlineError);
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
    let filteredLocal = localSales;
    let filteredOnline = onlineOrders;

    if (saleTypeFilter === 'online') {
      filteredLocal = [];
    } else if (saleTypeFilter === 'pos') {
      filteredOnline = [];
    } else if (saleTypeFilter === 'cuenta_corriente') {
      filteredLocal = localSales.filter(sale => sale.payment_method === 'cuenta_corriente');
      filteredOnline = [];
    }

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

  const handleShowDetail = (sale: any) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  // Generar comprobante cuando el modal se abre
  useEffect(() => {
    if (showDetailModal && selectedSale && canvasRef.current) {
      // Esperar un poco más para asegurar que el canvas esté en el DOM
      const timer = setTimeout(() => generateReceiptImage(), 200);
      return () => clearTimeout(timer);
    }
  }, [showDetailModal, selectedSale]);

  const generateReceiptImage = () => {
    if (!selectedSale || !canvasRef.current) {
      console.log('No selectedSale or canvasRef', { selectedSale, canvas: canvasRef.current });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No canvas context');
      return;
    }

    console.log('Generando comprobante para:', selectedSale);

    // Usar datos almacenados si están disponibles, si no, regenerar
    const useStoredData = selectedSale.receipt_data != null;
    const receiptInfo = useStoredData ? selectedSale.receipt_data : selectedSale;

    // Configurar canvas
    canvas.width = 400;
    const itemsHeight = receiptInfo.items?.length ? receiptInfo.items.length * 30 : 0;
    canvas.height = selectedSale.type === 'pos' ? 600 + itemsHeight : 550 + itemsHeight;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuración de texto
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    let yPos = 30;

    // Header
    ctx.font = 'bold 24px Arial';
    ctx.fillText('CABRÓN STORE', canvas.width / 2, yPos);
    yPos += 30;

    ctx.font = '14px Arial';
    ctx.fillText('Comprobante de Venta', canvas.width / 2, yPos);
    yPos += 40;

    // Línea separadora
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 30;

    // Información
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';

    if (selectedSale.type === 'pos') {
      ctx.fillText(`Nº Ticket: ${receiptInfo.sale_number}`, 20, yPos);
      yPos += 20;
      ctx.fillText(`Cliente: ${receiptInfo.customer_name}`, 20, yPos);
      yPos += 20;
    } else {
      const onlineSale = selectedSale as OnlineOrder & { type: 'online' };
      ctx.fillText(`Cliente: ${receiptInfo.customer_name || onlineSale.customer_name}`, 20, yPos);
      yPos += 20;
      if (receiptInfo.customer_email || onlineSale.customer_email) {
        ctx.fillText(`Email: ${receiptInfo.customer_email || onlineSale.customer_email}`, 20, yPos);
        yPos += 20;
      }
    }

    ctx.fillText(`Fecha: ${formatDate(selectedSale.created_at)}`, 20, yPos);
    yPos += 30;

    // Productos
    ctx.font = 'bold 12px Arial';
    ctx.fillText('PRODUCTOS', 20, yPos);
    yPos += 20;

    ctx.font = '11px Arial';
    if (receiptInfo.items && receiptInfo.items.length > 0) {
      receiptInfo.items.forEach((item: any) => {
        // Si usamos datos almacenados, ya tiene la estructura correcta
        // Si regeneramos, usamos la estructura original
        const itemName = useStoredData ? item.name : (item.name || 'Producto eliminado');
        const itemQuantity = item.quantity;
        const itemPrice = item.price || item.unit_price;
        const itemDiscount = item.discount_percentage || item.discount || 0;
        
        const itemText = `${itemQuantity}x ${itemName}`;
        const originalPrice = itemPrice * itemQuantity;
        const priceText = `$${originalPrice.toFixed(2)}`;
        
        ctx.textAlign = 'left';
        ctx.fillText(itemText, 20, yPos);
        ctx.textAlign = 'right';
        ctx.fillText(priceText, canvas.width - 20, yPos);
        yPos += 20;
        
        // Mostrar descuento si existe
        if (itemDiscount > 0) {
          const discountAmount = originalPrice * (itemDiscount / 100);
          const discountText = `  Descuento ${itemDiscount}%`;
          const discountAmountText = `-$${discountAmount.toFixed(2)}`;
          
          ctx.fillStyle = '#666666';
          ctx.font = '10px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(discountText, 30, yPos);
          ctx.textAlign = 'right';
          ctx.fillText(discountAmountText, canvas.width - 20, yPos);
          ctx.fillStyle = '#000000';
          ctx.font = '11px Arial';
          yPos += 20;
        } else {
          yPos += 5;
        }
      });
    }

    yPos += 10;

    // Línea separadora
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 20;

    // Total
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL:', 20, yPos);
    ctx.textAlign = 'right';
    ctx.fillText(`$${selectedSale.total.toFixed(2)}`, canvas.width - 20, yPos);
    yPos += 30;

    // Método de pago
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const paymentMethod = selectedSale.type === 'pos' 
      ? (selectedSale as LocalSale).payment_method 
      : 'Mercado Pago';
    ctx.fillText(`Método de pago: ${paymentMethod}`, 20, yPos);
    yPos += 40;

    // Footer
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 20;

    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡Gracias por su compra!', canvas.width / 2, yPos);
    yPos += 15;
    ctx.fillText('www.cabronstore.com', canvas.width / 2, yPos);
  };

  const downloadReceipt = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = selectedSale?.type === 'pos' 
        ? `comprobante-${(selectedSale as LocalSale).sale_number}.png`
        : `comprobante-${selectedSale?.id}.png`;
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const totals = calculateTotals();

  const allSales = [
    ...localSales.map(sale => ({ ...sale, type: 'pos' as const })),
    ...onlineOrders.map(order => ({ ...order, type: 'online' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredSales = allSales.filter(sale => {
    if (saleTypeFilter === 'all') return true;
    if (saleTypeFilter === 'cuenta_corriente') {
      return sale.type === 'pos' && (sale as LocalSale).payment_method === 'cuenta_corriente';
    }
    return sale.type === saleTypeFilter;
  });

  return (
    <>
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
                <option value="cuenta_corriente">Cuenta Corriente</option>
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
                      Cliente / Nº Venta
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
                    <tr 
                      key={`${sale.type}-${sale.id}`} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleShowDetail(sale)}
                    >
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.type === 'pos' ? (
                          <div>
                            <div className="font-semibold">{(sale as LocalSale).customer_name}</div>
                            <div className="text-xs text-gray-500">{(sale as LocalSale).sale_number}</div>
                          </div>
                        ) : (
                          (sale as OnlineOrder).customer_name
                        )}
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

      {/* Modal de Detalle de Venta */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                📄 Detalle de Venta
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSale(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Canvas del comprobante */}
              <div className="flex justify-center mb-4">
                <canvas 
                  ref={canvasRef}
                  width={400}
                  height={600}
                  className="border border-gray-300 rounded shadow-lg max-w-full"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={downloadReceipt}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  📥 Descargar Comprobante
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSale(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

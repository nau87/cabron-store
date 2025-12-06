'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useReceiptGenerator } from '@/components/ReceiptGenerator';
import toast from 'react-hot-toast';

interface Customer {
  customer_id: string;
  full_name: string;
  email: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: 'sale' | 'payment';
  amount: number;
  description: string;
  payment_method?: string;
  sale_id?: string;
  created_at: string;
  receipt_data?: any;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function CuentasCorrientesPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const { generateAndDownload } = useReceiptGenerator();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadCustomers();
    }
  }, [isAdmin]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .order('balance', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadTransactions = async (customerId: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('customer_account_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Para cada transacción de tipo 'sale', cargar los items de la venta
      const transactionsWithItems = await Promise.all(
        (data || []).map(async (transaction) => {
          if (transaction.type === 'sale' && transaction.sale_id) {
            const { data: saleData } = await supabase
              .from('sales')
              .select('items')
              .eq('id', transaction.sale_id)
              .single();
            
            return {
              ...transaction,
              items: saleData?.items || []
            };
          }
          return transaction;
        })
      );
      
      setTransactions(transactionsWithItems);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadTransactions(customer.customer_id);
  };

  const handleRegisterPayment = async () => {
    if (!selectedCustomer || !paymentAmount) {
      toast.error('INGRESA EL MONTO DEL PAGO');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error('EL MONTO DEBE SER MAYOR A 0');
      return;
    }

    setProcessingPayment(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Preparar datos del comprobante
      const receiptData = {
        customer_name: selectedCustomer.full_name,
        customer_email: selectedCustomer.email,
        amount: amount,
        payment_method: paymentMethod,
        description: paymentDescription || `Pago registrado - ${paymentMethod}`,
        date: new Date().toISOString(),
      };

      const { error } = await supabase.rpc('register_payment', {
        p_customer_id: selectedCustomer.customer_id,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_description: paymentDescription || `Pago registrado - ${paymentMethod}`,
        p_admin_id: user?.id,
      });

      if (error) throw error;

      // Actualizar la transacción de pago con receipt_data
      const { error: updateError } = await supabase
        .from('customer_account_transactions')
        .update({ receipt_data: receiptData })
        .eq('customer_id', selectedCustomer.customer_id)
        .eq('type', 'payment')
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.error('Error actualizando receipt_data del pago:', updateError);
      }

      toast.success('PAGO REGISTRADO EXITOSAMENTE');
      
      // Guardar datos para comprobante
      const receiptCustomerName = selectedCustomer.full_name;
      const receiptAmount = amount;
      const receiptPaymentMethod = paymentMethod;
      const receiptDescription = paymentDescription || `Pago registrado - ${paymentMethod}`;
      
      // Recargar datos
      await loadCustomers();
      await loadTransactions(selectedCustomer.customer_id);
      
      // Actualizar saldo del cliente seleccionado
      const updatedCustomer = customers.find(c => c.customer_id === selectedCustomer.customer_id);
      if (updatedCustomer) {
        setSelectedCustomer(updatedCustomer);
      }

      // Limpiar formulario
      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentModal(false);

      // Preguntar si desea generar comprobante
      if (confirm('¿Desea generar el comprobante de pago?')) {
        generateAndDownload({
          type: 'payment',
          customerName: receiptCustomerName,
          total: receiptAmount,
          paymentMethod: receiptPaymentMethod,
          description: receiptDescription,
          date: new Date(),
        });
      }
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('ERROR AL REGISTRAR EL PAGO');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleShowReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  // Generar comprobante cuando el modal se abre
  useEffect(() => {
    if (showReceiptModal && selectedTransaction && canvasRef.current && selectedCustomer) {
      const timer = setTimeout(() => generateReceiptImage(), 200);
      return () => clearTimeout(timer);
    }
  }, [showReceiptModal, selectedTransaction, selectedCustomer]);

  const generateReceiptImage = () => {
    if (!selectedTransaction || !canvasRef.current || !selectedCustomer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos almacenados si están disponibles
    const useStoredData = selectedTransaction.receipt_data != null;
    const receiptInfo = useStoredData ? selectedTransaction.receipt_data : selectedTransaction;

    // Calcular altura dinámica basada en items
    const itemsCount = receiptInfo.items?.length || 0;
    const itemsHeight = itemsCount * 25;
    const baseHeight = selectedTransaction.type === 'sale' ? 400 : 350;
    
    // Configurar canvas
    canvas.width = 400;
    canvas.height = baseHeight + itemsHeight;

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
    ctx.fillText(
      selectedTransaction.type === 'sale' ? 'Comprobante de Venta' : 'Comprobante de Pago',
      canvas.width / 2,
      yPos
    );
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

    ctx.fillText(`Cliente: ${selectedCustomer.full_name}`, 20, yPos);
    yPos += 20;
    ctx.fillText(`Email: ${selectedCustomer.email}`, 20, yPos);
    yPos += 20;
    ctx.fillText(`Fecha: ${formatDate(selectedTransaction.created_at)}`, 20, yPos);
    yPos += 30;

    if (selectedTransaction.type === 'sale') {
      // Para ventas
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PRODUCTOS', 20, yPos);
      yPos += 20;

      ctx.font = '11px Arial';
      if (receiptInfo.items && receiptInfo.items.length > 0) {
        receiptInfo.items.forEach((item: any) => {
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
      } else {
        ctx.textAlign = 'left';
        ctx.fillText('Sin detalle de productos', 20, yPos);
        yPos += 25;
      }
    } else {
      // Para pagos
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PAGO REALIZADO', 20, yPos);
      yPos += 25;

      ctx.font = '11px Arial';
      if (selectedTransaction.payment_method) {
        ctx.fillText(`Método de pago: ${selectedTransaction.payment_method}`, 20, yPos);
        yPos += 20;
      }
      if (selectedTransaction.description) {
        ctx.fillText(selectedTransaction.description, 20, yPos);
        yPos += 25;
      }
    }

    yPos += 10;

    // Línea separadora
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(20, yPos);
    ctx.lineTo(canvas.width - 20, yPos);
    ctx.stroke();
    yPos += 20;

    // Total/Monto
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      selectedTransaction.type === 'sale' ? 'TOTAL:' : 'MONTO:',
      20,
      yPos
    );
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.abs(selectedTransaction.amount).toFixed(2)}`, canvas.width - 20, yPos);
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
    ctx.fillText(
      selectedTransaction.type === 'sale' ? '¡Gracias por su compra!' : '¡Gracias por su pago!',
      canvas.width / 2,
      yPos
    );
    yPos += 15;
    ctx.fillText('www.cabronstore.com', canvas.width / 2, yPos);
  };

  const downloadReceipt = () => {
    if (!canvasRef.current || !selectedTransaction) return;

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `comprobante-${selectedTransaction.type}-${selectedTransaction.id.slice(0, 8)}.png`;
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Cuentas Corrientes</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Clientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Clientes</h2>
            </div>

            {loadingCustomers ? (
              <div className="p-8 text-center">Cargando clientes...</div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.customer_id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedCustomer?.customer_id === customer.customer_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{customer.full_name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
                            customer.balance > 0
                              ? 'text-red-600'
                              : customer.balance < 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          ${Math.abs(customer.balance).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.balance > 0 ? 'Debe' : customer.balance < 0 ? 'A favor' : 'Al día'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {customers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No hay clientes registrados
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detalle del Cliente */}
          <div className="bg-white rounded-lg shadow">
            {selectedCustomer ? (
              <>
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedCustomer.full_name}</h2>
                      <p className="text-gray-600">{selectedCustomer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Saldo</p>
                      <p
                        className={`font-bold text-2xl ${
                          selectedCustomer.balance > 0
                            ? 'text-red-600'
                            : selectedCustomer.balance < 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}
                      >
                        ${Math.abs(selectedCustomer.balance).toLocaleString()}
                      </p>
                      <p className="text-xs">
                        {selectedCustomer.balance > 0 ? 'Debe' : selectedCustomer.balance < 0 ? 'A favor' : 'Al día'}
                      </p>
                    </div>
                  </div>

                  {selectedCustomer.balance > 0 && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                    >
                      Registrar Pago
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold mb-4">Historial de Movimientos</h3>

                  {loadingTransactions ? (
                    <div className="text-center py-8">Cargando movimientos...</div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          onClick={() => handleShowReceipt(transaction)}
                          className="border-l-4 pl-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors rounded"
                          style={{
                            borderColor: transaction.type === 'sale' ? '#ef4444' : '#10b981',
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {transaction.type === 'sale' ? '🛍️ Compra' : '💰 Pago'}
                              </p>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              {transaction.payment_method && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Método: {transaction.payment_method}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold ${
                                  transaction.type === 'sale' ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {transaction.type === 'sale' ? '+' : ''}$
                                {Math.abs(transaction.amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {transactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          Sin movimientos registrados
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Selecciona un cliente para ver su detalle
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Registrar Pago</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setPaymentDescription('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Cliente</p>
              <p className="font-semibold">{selectedCustomer.full_name}</p>
              <p className="text-sm text-gray-500">Saldo actual: ${selectedCustomer.balance.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monto del Pago *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Método de Pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta_debito">Tarjeta Débito</option>
                  <option value="tarjeta_credito">Tarjeta Crédito</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Detalles del pago..."
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <button
                onClick={handleRegisterPayment}
                disabled={processingPayment}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold"
              >
                {processingPayment ? 'Procesando...' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprobante */}
      {showReceiptModal && selectedTransaction && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                📄 Comprobante
              </h2>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedTransaction(null);
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
                    setShowReceiptModal(false);
                    setSelectedTransaction(null);
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
      </div>
    </>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/AdminNav';
import { useReceiptGenerator } from '@/components/ReceiptGenerator';

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
  created_at: string;
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
      setTransactions(data || []);
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
      alert('Ingresa el monto del pago');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setProcessingPayment(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.rpc('register_payment', {
        p_customer_id: selectedCustomer.customer_id,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_description: paymentDescription || `Pago registrado - ${paymentMethod}`,
        p_admin_id: user?.id,
      });

      if (error) throw error;

      alert('✅ Pago registrado exitosamente');
      
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
      alert('Error al registrar el pago');
    } finally {
      setProcessingPayment(false);
    }
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
                          className="border-l-4 pl-4 py-2"
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
      </div>
    </>
  );
}

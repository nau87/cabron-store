'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'sale' | 'payment';
  amount: number;
  description: string;
  payment_method?: string;
  sale_id?: string;
  created_at: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function MiCuentaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadAccountData();
    }
  }, [user]);

  const loadAccountData = async () => {
    if (!user) return;

    setLoadingData(true);
    try {
      // Obtener el saldo
      const { data: balanceData, error: balanceError } = await supabase
        .from('customer_balances')
        .select('balance')
        .eq('customer_id', user.id)
        .single();

      if (!balanceError && balanceData) {
        setBalance(balanceData.balance);
      }

      // Obtener transacciones
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('customer_account_transactions')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (!transactionsError && transactionsData) {
        // Para cada transacción de tipo 'sale', cargar los items de la venta
        const transactionsWithItems = await Promise.all(
          transactionsData.map(async (transaction) => {
            if (transaction.type === 'sale' && transaction.sale_id) {
              const { data: saleData } = await supabase
                .from('local_sales')
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
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoadingData(false);
    }
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

  const handleShowReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  // Generar comprobante cuando el modal se abre
  useEffect(() => {
    if (showReceiptModal && selectedTransaction && canvasRef.current && user) {
      const timer = setTimeout(() => generateReceiptImage(), 200);
      return () => clearTimeout(timer);
    }
  }, [showReceiptModal, selectedTransaction, user]);

  const generateReceiptImage = () => {
    if (!selectedTransaction || !canvasRef.current || !user) return;

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

    ctx.fillText(`Cliente: ${user.email}`, 20, yPos);
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
          
          const itemText = `${itemQuantity}x ${itemName}`;
          const priceText = `$${(itemPrice * itemQuantity).toFixed(2)}`;
          
          ctx.textAlign = 'left';
          ctx.fillText(itemText, 20, yPos);
          ctx.textAlign = 'right';
          ctx.fillText(priceText, canvas.width - 20, yPos);
          yPos += 25;
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white dark:bg-black">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            ← Volver a la tienda
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
          Mi Cuenta Corriente
        </h1>

        {/* Saldo */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Saldo Actual
          </h2>
          <p
            className={`text-4xl font-bold ${
              balance > 0
                ? 'text-red-600 dark:text-red-400'
                : balance < 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            ${Math.abs(balance).toFixed(2)}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {balance > 0
              ? 'Saldo a favor de la tienda (deuda)'
              : balance < 0
              ? 'Saldo a tu favor (crédito)'
              : 'Sin saldo pendiente'}
          </p>
        </div>

        {/* Historial de Transacciones */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Historial de Movimientos
          </h2>

          {transactions.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-8 text-center border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400">
                No hay movimientos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => handleShowReceipt(transaction)}
                  className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {transaction.type === 'sale' ? '🛍️' : '💰'}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          {transaction.type === 'sale' ? 'Compra' : 'Pago'}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {transaction.description}
                          </p>
                        )}
                        {transaction.payment_method && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            Método: {transaction.payment_method}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'sale'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {transaction.type === 'sale' ? '+' : '-'}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>

      {/* Modal de Comprobante */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                📄 Comprobante
              </h2>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedTransaction(null);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
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
                  className="border border-zinc-300 dark:border-zinc-700 rounded shadow-lg max-w-full"
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
                  className="bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white px-6 py-2 rounded-lg font-semibold transition-colors"
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

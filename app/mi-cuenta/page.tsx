'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'sale' | 'payment';
  amount: number;
  description: string;
  payment_method?: string;
  created_at: string;
}

export default function MiCuentaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
        setTransactions(transactionsData);
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
                  className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800"
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
    </>
  );
}

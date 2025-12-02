'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/AdminNav';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
  sku?: string;
  size?: string;
  color?: string;
}

interface POSItem {
  product: Product;
  quantity: number;
  discount: number; // descuento por unidad en porcentaje
}

interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function POSPage() {
  const { isAdmin, loading, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<POSItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: 'Cliente General' });
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [processingeSale, setProcessingSale] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [registeredCustomers, setRegisteredCustomers] = useState<any[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSku, setReturnSku] = useState('');
  const [returnSize, setReturnSize] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [isAccountSale, setIsAccountSale] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadCustomers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customer_balances')
      .select('customer_id, full_name, email, balance')
      .order('full_name');

    if (!error && data) {
      // Mapear los datos para que coincidan con la estructura esperada
      const mappedCustomers = data.map(c => ({
        id: c.customer_id,
        full_name: c.full_name,
        email: c.email,
      }));
      setRegisteredCustomers(mappedCustomers);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product: Product) => {
    // Si el producto tiene talle, mostrar modal para seleccionarlo
    if (product.size) {
      setSelectedProductForSize(product);
      setSelectedSize(product.size);
      setShowSizeModal(true);
      return;
    }

    // Si no tiene talle, agregar directamente
    addProductToCart(product);
  };

  const addProductToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity < product.stock) {
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        alert('No hay más stock disponible');
      }
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const confirmAddToCart = async () => {
    if (!selectedProductForSize || !selectedSize) {
      alert('Selecciona un talle');
      return;
    }

    // Obtener el SKU base del producto (sin el talle)
    // Si el producto tiene SKU, buscar por SKU base y talle
    // Si no tiene SKU, usar el nombre del producto
    let query = supabase
      .from('products')
      .select('*')
      .eq('size', selectedSize)
      .gt('stock', 0);

    // Si el producto tiene SKU, usarlo para la búsqueda
    if (selectedProductForSize.sku) {
      // Extraer SKU base (antes del último guión si existe)
      const skuParts = selectedProductForSize.sku.split('-');
      if (skuParts.length > 1) {
        // Remover el último elemento (que sería el talle)
        const baseSkuPattern = skuParts.slice(0, -1).join('-');
        query = query.like('sku', `${baseSkuPattern}%`);
      } else {
        query = query.like('sku', `${selectedProductForSize.sku}%`);
      }
    } else {
      // Si no hay SKU, buscar por nombre
      query = query.eq('name', selectedProductForSize.name);
    }

    const { data: productWithSize, error } = await query.single();

    if (error || !productWithSize) {
      alert(`No hay stock disponible del talle ${selectedSize}`);
      console.error('Error buscando producto:', error);
      return;
    }

    addProductToCart(productWithSize);
    setShowSizeModal(false);
    setSelectedProductForSize(null);
    setSelectedSize('');
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart];
    if (quantity <= 0) {
      newCart.splice(index, 1);
    } else if (quantity <= newCart[index].product.stock) {
      newCart[index].quantity = quantity;
    } else {
      alert('No hay suficiente stock');
      return;
    }
    setCart(newCart);
  };

  const updateItemDiscount = (index: number, discount: number) => {
    const newCart = [...cart];
    newCart[index].discount = Math.max(0, Math.min(100, discount));
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.product.price * item.quantity;
      const itemDiscount = (itemPrice * item.discount) / 100;
      return sum + (itemPrice - itemDiscount);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const generalDiscountAmount = (subtotal * generalDiscount) / 100;
    return subtotal - generalDiscountAmount;
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!customer.name.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    // Si es venta a cuenta corriente, el cliente debe estar registrado
    if (isAccountSale && !customer.id) {
      alert('Para venta a cuenta corriente debes seleccionar un cliente registrado');
      return;
    }

    setProcessingSale(true);

    try {
      // Generar número de venta
      const { data: saleNumberData } = await supabase.rpc('generate_sale_number');
      const saleNumber = saleNumberData || `SALE-${Date.now()}`;

      // Preparar items
      const items = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        discount_percentage: item.discount,
        subtotal: item.product.price * item.quantity * (1 - item.discount / 100),
      }));

      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      const discountAmount = subtotal - total;

      // Crear venta
      const { data: saleData, error: saleError } = await supabase
        .from('local_sales')
        .insert([
          {
            sale_number: saleNumber,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            user_id: customer.id,
            items,
            subtotal,
            discount_amount: discountAmount,
            discount_percentage: generalDiscount,
            total,
            payment_method: isAccountSale ? 'cuenta_corriente' : paymentMethod,
            admin_user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Si es venta a cuenta corriente, registrar en transacciones
      if (isAccountSale && customer.id && saleData) {
        const { error: accountError } = await supabase.rpc('register_sale_to_account', {
          p_customer_id: customer.id,
          p_sale_id: saleData.id,
          p_amount: total,
          p_admin_id: user?.id,
        });

        if (accountError) {
          console.error('Error registrando en cuenta corriente:', accountError);
          alert('⚠️ Venta completada pero error al registrar en cuenta corriente');
        }
      }

      // Limpiar carrito
      setCart([]);
      setCustomer({ name: 'Cliente General' });
      setGeneralDiscount(0);
      setPaymentMethod('efectivo');
      setIsAccountSale(false);
      loadProducts(); // Recargar productos para actualizar stock

      const message = isAccountSale 
        ? `✅ Venta #${saleNumber} a cuenta corriente!\nTotal: $${total.toFixed(2)}`
        : `✅ Venta #${saleNumber} completada!\nTotal: $${total.toFixed(2)}`;
      
      alert(message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la venta');
    } finally {
      setProcessingSale(false);
    }
  };

  const handleReturn = async () => {
    if (!returnSku.trim()) {
      alert('Ingresa el SKU del producto');
      return;
    }

    if (!returnSize.trim()) {
      alert('Ingresa el talle del producto');
      return;
    }

    if (returnQuantity < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    setProcessingReturn(true);

    try {
      // Buscar producto por SKU y talle (SIN filtro de stock, puede estar en 0)
      const { data: products, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', returnSku.trim())
        .eq('size', returnSize.trim())
        .single();

      if (searchError || !products) {
        alert('No se encontró un producto con ese SKU y talle');
        setProcessingReturn(false);
        return;
      }

      // Actualizar stock
      const newStock = products.stock + returnQuantity;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', products.id);

      if (updateError) throw updateError;

      // Registrar en historial de inventario
      await supabase
        .from('inventory_history')
        .insert({
          product_id: products.id,
          change_type: 'return',
          quantity_change: returnQuantity,
          stock_after: newStock,
          reason: `Devolución - SKU: ${returnSku} Talle: ${returnSize}`,
        });

      alert(`✅ Devolución procesada!\nProducto: ${products.name}\nStock actualizado: ${newStock}`);
      
      // Limpiar y cerrar modal
      setReturnSku('');
      setReturnSize('');
      setReturnQuantity(1);
      setShowReturnModal(false);
      loadProducts(); // Recargar productos
    } catch (error) {
      console.error('Error en devolución:', error);
      alert('Error al procesar la devolución');
    } finally {
      setProcessingReturn(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="flex h-screen">
          {/* Productos - Lado Izquierdo */}
          <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              🏪 Punto de Venta
            </h1>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 DEVOLUCIÓN
              </button>
            </div>

            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white mb-4"
            />

            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white dark:bg-zinc-800 rounded-lg p-4 hover:shadow-lg transition-shadow text-left border border-zinc-200 dark:border-zinc-700"
              >
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  {product.size} | {product.color}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-zinc-900 dark:text-white">
                    ${product.price}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Stock: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito - Lado Derecho */}
        <div className="w-96 bg-white dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 flex flex-col">
          {/* Cliente */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full text-left p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Cliente</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{customer.name}</p>
              {customer.phone && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{customer.phone}</p>
              )}
            </button>
          </div>

          {/* Items del Carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-zinc-500 dark:text-zinc-400 mt-8">
                Carrito vacío
              </p>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ${item.product.price} x {item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex items-center border border-zinc-300 dark:border-zinc-600 rounded">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                      >
                        +
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItemDiscount(index, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-sm"
                      placeholder="% desc"
                    />

                    <span className="font-bold text-sm ml-auto">
                      ${(item.product.price * item.quantity * (1 - item.discount / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y Pago */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
            {/* Descuento General */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-300">Desc. General:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={generalDiscount}
                onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                placeholder="%"
              />
            </div>

            {/* Cuenta Corriente */}
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <input
                type="checkbox"
                id="accountSale"
                checked={isAccountSale}
                onChange={(e) => {
                  setIsAccountSale(e.target.checked);
                  if (e.target.checked && customer.name === 'Cliente General') {
                    alert('Debes seleccionar un cliente registrado para venta a cuenta corriente');
                    setShowCustomerModal(true);
                  }
                }}
                className="w-5 h-5 rounded border-yellow-300"
              />
              <label htmlFor="accountSale" className="flex-1 text-sm font-medium cursor-pointer">
                📋 Venta a Cuenta Corriente
                {isAccountSale && !customer.id && (
                  <span className="block text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    ⚠️ Selecciona un cliente registrado
                  </span>
                )}
              </label>
            </div>

            {/* Método de Pago (solo si no es cuenta corriente) */}
            {!isAccountSale && (
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta_debito">💳 Tarjeta Débito</option>
                <option value="tarjeta_credito">💳 Tarjeta Crédito</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="mercadopago">📱 Mercado Pago</option>
              </select>
            )}

            {/* Totales */}
            <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Subtotal:</span>
                <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
              </div>
              {(generalDiscount > 0 || cart.some(i => i.discount > 0)) && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Descuento:</span>
                  <span>-${(calculateSubtotal() - calculateTotal()).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>TOTAL:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Botón Cobrar */}
            <button
              onClick={completeSale}
              disabled={cart.length === 0 || processingeSale}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {processingeSale ? 'Procesando...' : '💰 COBRAR'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cliente */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Seleccionar Cliente</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-2xl text-zinc-500 hover:text-zinc-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar cliente por nombre o email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                autoFocus
              />
            </div>

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              <button
                onClick={() => {
                  setCustomer({ name: 'Cliente General' });
                  setShowCustomerModal(false);
                  setCustomerSearchTerm('');
                }}
                className="w-full p-3 text-left bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600"
              >
                Cliente General
              </button>

              {registeredCustomers
                .filter(c => {
                  const searchLower = customerSearchTerm.toLowerCase();
                  const name = (c.full_name || '').toLowerCase();
                  const email = (c.email || '').toLowerCase();
                  return name.includes(searchLower) || email.includes(searchLower);
                })
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCustomer({
                        id: c.id,
                        name: c.full_name || c.email,
                        email: c.email,
                      });
                      setShowCustomerModal(false);
                      setCustomerSearchTerm('');
                    }}
                    className="w-full p-3 text-left bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600"
                  >
                    <p className="font-semibold">{c.full_name || c.email}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.email}</p>
                  </button>
                ))
              }

              {registeredCustomers.filter(c => {
                const searchLower = customerSearchTerm.toLowerCase();
                const name = (c.full_name || '').toLowerCase();
                const email = (c.email || '').toLowerCase();
                return name.includes(searchLower) || email.includes(searchLower);
              }).length === 0 && customerSearchTerm && (
                <p className="text-center text-zinc-500 py-4">No se encontraron clientes</p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">O crear cliente temporal:</p>
              <input
                type="text"
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setCustomer({ name: e.currentTarget.value.trim() });
                    setShowCustomerModal(false);
                    setCustomerSearchTerm('');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Devolución */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                🔄 Procesar Devolución
              </h2>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnSku('');
                  setReturnSize('');
                  setReturnQuantity(1);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  SKU del Producto *
                </label>
                <input
                  type="text"
                  value={returnSku}
                  onChange={(e) => setReturnSku(e.target.value.toUpperCase())}
                  placeholder="Ej: REM-001-XL"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Talle *
                </label>
                <input
                  type="text"
                  value={returnSize}
                  onChange={(e) => setReturnSize(e.target.value.toUpperCase())}
                  placeholder="Ej: XL, M, L"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Esta acción aumentará el stock del producto y lo hará visible nuevamente en la web si estaba agotado.
                </p>
              </div>

              <button
                onClick={handleReturn}
                disabled={processingReturn}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-400 text-white py-3 rounded-lg font-bold transition-colors"
              >
                {processingReturn ? 'Procesando...' : 'Procesar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Talle */}
      {showSizeModal && selectedProductForSize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                👕 Seleccionar Talle
              </h2>
              <button
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedProductForSize(null);
                  setSelectedSize('');
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-100 dark:bg-zinc-700 rounded-lg p-4">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {selectedProductForSize.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedProductForSize.category}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Talle Disponible *
                </label>
                <input
                  type="text"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value.toUpperCase())}
                  placeholder="Ej: XL, M, L, S"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-center text-lg font-semibold"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Se verificará el stock disponible del talle ingresado antes de agregarlo al carrito.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSizeModal(false);
                    setSelectedProductForSize(null);
                    setSelectedSize('');
                  }}
                  className="flex-1 bg-zinc-300 hover:bg-zinc-400 text-zinc-900 py-3 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAddToCart}
                  disabled={!selectedSize.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  Agregar al Carrito
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

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    max_uses: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadCoupons();
    }
  }, [isAdmin]);

  const loadCoupons = async () => {
    try {
      console.log('🔄 Cargando cupones...');
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al cargar cupones:', error);
        throw error;
      }
      
      console.log('✅ Cupones cargados:', data);
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('ERROR AL CARGAR CUPONES');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('EL CÓDIGO ES OBLIGATORIO');
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error('EL DESCUENTO DEBE SER MAYOR A 0');
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase_amount: formData.min_purchase_amount,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('CUPÓN ACTUALIZADO');
      } else {
        console.log('📝 Creando nuevo cupón:', couponData);
        const { data, error } = await supabase
          .from('coupons')
          .insert([couponData])
          .select();

        if (error) {
          console.error('❌ Error al crear cupón:', error);
          if (error.code === '23505') {
            toast.error('YA EXISTE UN CUPÓN CON ESE CÓDIGO');
          } else {
            throw error;
          }
          return;
        }
        console.log('✅ Cupón creado exitosamente:', data);
        toast.success('CUPÓN CREADO');
      }

      resetForm();
      await loadCoupons(); // Recargar lista inmediatamente
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('ERROR AL GUARDAR CUPÓN');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount,
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until?.split('T')[0] || '',
      max_uses: coupon.max_uses?.toString() || '',
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cupón?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('CUPÓN ELIMINADO');
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('ERROR AL ELIMINAR CUPÓN');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(coupon.is_active ? 'CUPÓN DESACTIVADO' : 'CUPÓN ACTIVADO');
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('ERROR AL ACTUALIZAR CUPÓN');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase_amount: 0,
      max_discount_amount: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      max_uses: '',
      is_active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase tracking-wider">CUPONES</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-zinc-800"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Cupón'}
        </button>
      </div>

        {/* Formulario */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 uppercase">
              {editingCoupon ? 'Editar Cupón' : 'Crear Cupón'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold uppercase"
                  placeholder="VERANO10"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="10% descuento verano"
                />
              </div>

              {/* Tipo de descuento */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Tipo de Descuento *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                  required
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>

              {/* Valor del descuento */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Valor del Descuento *
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                  placeholder={formData.discount_type === 'percentage' ? '10' : '1000'}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.discount_type === 'percentage' ? 'Porcentaje (ej: 10 = 10%)' : 'Monto en pesos'}
                </p>
              </div>

              {/* Compra mínima */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Compra Mínima ($)
                </label>
                <input
                  type="number"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Descuento máximo (solo para porcentaje) */}
              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase">
                    Descuento Máximo ($)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg font-semibold"
                    placeholder="Sin límite"
                    min="0"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Opcional: límite de ahorro
                  </p>
                </div>
              )}

              {/* Fecha inicio */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Válido Desde *
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                  required
                />
              </div>

              {/* Fecha fin */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Válido Hasta
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Opcional: sin vencimiento
                </p>
              </div>

              {/* Usos máximos */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">
                  Usos Máximos
                </label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-semibold"
                  placeholder="Ilimitado"
                  min="0"
                />
              </div>

              {/* Estado */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-bold uppercase">Activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-zinc-800"
              >
                {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
              </button>
              {editingCoupon && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-zinc-300 rounded-lg font-bold uppercase hover:bg-zinc-100"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {/* Lista de cupones */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Descuento</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Compra Mín</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Vigencia</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Usos</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-bold uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold uppercase">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-sm text-zinc-600">{coupon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `$${coupon.discount_value.toLocaleString('es-AR')}`}
                      {coupon.max_discount_amount && (
                        <span className="text-xs text-zinc-500 block">
                          Máx: ${coupon.max_discount_amount.toLocaleString('es-AR')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      ${coupon.min_purchase_amount.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p>Desde: {new Date(coupon.valid_from).toLocaleDateString('es-AR')}</p>
                        <p>Hasta: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('es-AR') : 'Sin venc.'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {coupon.used_count} / {coupon.max_uses || '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 hover:bg-zinc-100 rounded"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {coupons.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <p className="text-lg uppercase font-semibold">No hay cupones creados</p>
                <p className="text-sm">Haz clic en "Nuevo Cupón" para crear uno</p>
              </div>
            )}
          </div>
        </div>
    </>
  );
}

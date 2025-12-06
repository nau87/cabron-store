'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductVariantsManager from '@/components/ProductVariantsManager';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  images?: string[];
  stock: number;
  category: string;
  sku?: string;
  size?: string;
  color?: string;
  material?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    loadProducts();
    loadNewOrdersCount();
    
    // Actualizar contador cada 30 segundos
    const interval = setInterval(loadNewOrdersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNewOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('sale_type', 'online')
        .in('status', ['pending_payment', 'approved']);

      if (!error && count !== null) {
        setNewOrdersCount(count);
      }
    } catch (error) {
      console.error('Error loading new orders count:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  return (
    <>
      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta Pedidos */}
          <button
            onClick={() => router.push('/admin/orders')}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  📋 Pedidos Online
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Gestionar pedidos de la web
                </p>
              </div>
              {newOrdersCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center animate-pulse">
                  {newOrdersCount}
                </span>
              )}
            </div>
          </button>

          {/* Tarjeta Cupones */}
          <button
            onClick={() => router.push('/admin/cupones')}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              🎟️ Cupones
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Crear códigos de descuento
            </p>
          </button>

          {/* Tarjeta Inventario */}
          <button
            onClick={() => router.push('/admin/inventory')}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              📦 Inventario
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Control de stock y variantes
            </p>
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Panel de Administración
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Gestiona tus productos e inventario
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            + Agregar Producto
          </button>
        </div>

        {loadingProducts ? (
          <p className="text-center text-zinc-600 dark:text-zinc-400">Cargando productos...</p>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 bg-zinc-100 dark:bg-zinc-700 rounded">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {product.size} | {product.color}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProductForVariants(product);
                          setShowVariantsModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Gestionar variantes (talles)"
                      >
                        Variantes
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            loadProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showVariantsModal && selectedProductForVariants && (
        <ProductVariantsManager
          productId={selectedProductForVariants.id}
          productName={selectedProductForVariants.name}
          productSku={selectedProductForVariants.sku || ''}
          onClose={() => {
            setShowVariantsModal(false);
            setSelectedProductForVariants(null);
            loadProducts(); // Recargar para actualizar stock total
          }}
        />
      )}
    </>
  );
}

function ProductModal({
  product,
  onClose,
  onSuccess,
}: {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || '',
    category: product?.category || 'Remeras',
    sku: product?.sku || '',
    color: product?.color || '',
    material: product?.material || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images && product.images.length > 0 ? product.images : []);
  const [existingUrls, setExistingUrls] = useState<string[]>(product?.images && product.images.length > 0 ? product.images : []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Extraer el path del storage desde una URL pública
  const getStoragePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  };

  // Eliminar imagen del storage
  const deleteImageFromStorage = async (imageUrl: string) => {
    const filePath = getStoragePathFromUrl(imageUrl);
    if (!filePath) return;

    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting image from storage:', error);
      } else {
        console.log('Image deleted from storage:', filePath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imagePreviews.length + files.length > 3) {
      toast.error('MÁXIMO 3 IMÁGENES POR PRODUCTO');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} SUPERA LOS 5MB`);
        continue;
      }

      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const preview = imagePreviews[index];
    
    // Si es URL existente, eliminarla del storage y de existingUrls
    if (preview.startsWith('http')) {
      deleteImageFromStorage(preview);
      setExistingUrls(prev => prev.filter(url => url !== preview));
    } else {
      // Si es preview local, quitar el archivo
      const localIndex = imagePreviews.slice(0, index).filter(p => !p.startsWith('http')).length;
      setImageFiles(prev => prev.filter((_, i) => i !== localIndex));
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const moveImageToFirst = (index: number) => {
    if (index === 0) return; // Ya es la primera
    
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const [movedImage] = newPreviews.splice(index, 1);
      newPreviews.unshift(movedImage);
      return newPreviews;
    });

    // Actualizar existingUrls si es una URL existente
    const preview = imagePreviews[index];
    if (preview.startsWith('http')) {
      setExistingUrls(prev => {
        const newUrls = prev.filter(url => url !== preview);
        newUrls.unshift(preview);
        return newUrls;
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const [draggedItem] = newPreviews.splice(draggedIndex, 1);
      newPreviews.splice(dropIndex, 0, draggedItem);
      return newPreviews;
    });

    // Si ambas son URLs existentes, actualizar existingUrls
    const draggedPreview = imagePreviews[draggedIndex];
    const dropPreview = imagePreviews[dropIndex];
    
    if (draggedPreview.startsWith('http') && dropPreview.startsWith('http')) {
      setExistingUrls(prev => {
        const draggedUrl = prev[prev.indexOf(draggedPreview)];
        const newUrls = [...prev];
        const dragIdx = newUrls.indexOf(draggedUrl);
        const [item] = newUrls.splice(dragIdx, 1);
        const dropIdx = imagePreviews.indexOf(dropPreview);
        newUrls.splice(dropIdx, 0, item);
        return newUrls;
      });
    }

    setDraggedIndex(null);
  };

  const uploadImages = async (): Promise<string[]> => {
    setUploadingImage(true);
    
    try {
      const finalUrls: string[] = [];

      // Procesar imagePreviews en orden
      for (const preview of imagePreviews) {
        if (preview.startsWith('http')) {
          // URL existente, mantenerla
          finalUrls.push(preview);
        } else {
          // Preview local (data:image), buscar el archivo correspondiente
          const localPreviews = imagePreviews.filter(p => !p.startsWith('http'));
          const localIndex = localPreviews.indexOf(preview);
          const file = imageFiles[localIndex];
          
          if (!file) continue;
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          finalUrls.push(publicUrl);
        }
      }

      return finalUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('ERROR AL SUBIR LAS IMÁGENES');
      return [];
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Subir imágenes
      const imageUrls = await uploadImages();
      
      if (imageUrls.length === 0) {
        toast.error('DEBES SUBIR AL MENOS UNA IMAGEN');
        setLoading(false);
        return;
      }

      // Si estamos editando, eliminar imágenes viejas que ya no están en la lista final
      if (product?.images && product.images.length > 0) {
        const oldImages = product.images;
        const imagesToDelete = oldImages.filter(oldUrl => !imageUrls.includes(oldUrl));
        
        // Eliminar imágenes huérfanas del storage
        for (const imageUrl of imagesToDelete) {
          await deleteImageFromStorage(imageUrl);
        }
        
        if (imagesToDelete.length > 0) {
          console.log(`Eliminadas ${imagesToDelete.length} imágenes antiguas del storage`);
        }
      }

      let currentStock = 0;
      
      // Si estamos editando, obtener el stock total de las variantes
      if (product) {
        const { data: variants } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('product_id', product.id);
        
        currentStock = variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      }

      const productData = { 
        ...formData, 
        stock: currentStock, // Al editar, mantener el stock de variantes; al crear, 0
        image_url: imageUrls[0], // Primera imagen como principal
        images: imageUrls, // Array completo
        original_price: Math.round(formData.price * 1.15) // Precio + 15% para mostrar tachado
      };

      if (product) {
        // Editar producto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Mostrar mensaje específico según el error
      let errorMessage = 'Error al guardar el producto';
      
      if (error?.code === '23505') {
        // Violación de constraint único
        if (error.message?.includes('idx_products_sku')) {
          errorMessage = '❌ El código SKU ya está en uso. Por favor usa otro código único.';
        } else {
          errorMessage = '❌ Este producto ya existe. Verifica los datos e intenta con valores únicos.';
        }
      } else if (error?.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Precio de Venta *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                💰 Se mostrará un precio tachado automáticamente (+15% para efecto descuento)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                SKU (Código) *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ej: CAB-001"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Este SKU será compartido por todas las variantes de talles
              </p>
            </div>

            <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    ¿Producto con talles/variantes?
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Después de crear el producto, usa el botón <strong className="text-green-600 dark:text-green-400">"Variantes"</strong> para agregar los talles (S, M, L, XL) y su stock individual. El stock total se calculará automáticamente.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                required
              >
                <option value="Remeras">Remeras</option>
                <option value="Camisas">Camisas</option>
                <option value="Pantalones">Pantalones</option>
                <option value="Buzos">Buzos</option>
                <option value="Camperas">Camperas</option>
                <option value="Shorts">Shorts</option>
                <option value="Calzado">Calzado</option>
                <option value="Accesorios">Accesorios</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Color (opcional)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Negro, Blanco..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Material (opcional)
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Algodón, Poliéster..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Imágenes del Producto * (Máximo 3)
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                🖱️ Arrastra las imágenes para cambiar el orden. La primera será la principal.
              </p>
              
              {/* Previews de imágenes */}
              {imagePreviews.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div 
                      key={index} 
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative aspect-square bg-zinc-100 dark:bg-zinc-700 rounded-lg overflow-hidden group cursor-move border-2 transition-all ${
                        draggedIndex === index ? 'border-blue-500 opacity-50 scale-95' : 'border-transparent hover:border-blue-300'
                      }`}
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover pointer-events-none"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          title="Eliminar imagen"
                          className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold shadow-lg">
                          ⭐ Principal
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                        <span className="text-white text-2xl drop-shadow-lg">🖱️</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input de archivos */}
              {imagePreviews.length < 3 && (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      📸 Haz clic para subir imagen {imagePreviews.length + 1} de 3
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      PNG, JPG o WEBP (max. 5MB cada una)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? 'Subiendo imagen...' : loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

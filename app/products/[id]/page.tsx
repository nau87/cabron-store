import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import ProductGallery from '@/components/ProductGallery';

async function getProduct(id: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  // Cargar variantes del producto
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .gt('stock', 0)
    .order('size');

  return { ...product, variants: variants || [] } as Product & { variants: any[] };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            Producto no encontrado
          </h1>
          <Link 
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:underline"
          >
            Volver a la tienda
          </Link>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <Link 
          href="/"
          className="inline-block mb-8 text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors"
        >
          ← VOLVER
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Section with Gallery */}
          <ProductGallery 
            images={product.images && product.images.length > 0 ? product.images : [product.image_url]} 
            productName={product.name}
          />

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {product.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">
              {product.name}
            </h1>

            <p className="text-zinc-600 text-lg mb-8 leading-relaxed font-light">
              {product.description}
            </p>

            <div className="mb-8">
              {product.original_price && product.original_price > product.price && (
                <p className="text-2xl font-bold text-zinc-400 line-through mb-2">
                  ${product.original_price.toLocaleString('es-AR')}
                </p>
              )}
              <p className="text-5xl font-black">
                ${product.price.toLocaleString('es-AR')}
              </p>
              {product.original_price && product.original_price > product.price && (
                <p className="text-sm font-semibold text-green-600 mt-2">
                  ¡Ahorrás ${(product.original_price - product.price).toLocaleString('es-AR')}!
                </p>
              )}
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
                Disponibilidad:{' '}
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock > 0 ? `${product.stock} EN STOCK` : 'AGOTADO'}
                </span>
              </p>
            </div>

            <AddToCartButton product={product} />

            {/* Detalles adicionales */}
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <div className="grid grid-cols-2 gap-6 text-sm">
                {product.material && (
                  <div>
                    <p className="font-bold uppercase tracking-wider text-zinc-500 mb-1">Material</p>
                    <p className="font-medium">{product.material}</p>
                  </div>
                )}
                {product.size && (
                  <div>
                    <p className="font-bold uppercase tracking-wider text-zinc-500 mb-1">Talle</p>
                    <p className="font-medium">{product.size}</p>
                  </div>
                )}
                {product.color && (
                  <div>
                    <p className="font-bold uppercase tracking-wider text-zinc-500 mb-1">Color</p>
                    <p className="font-medium">{product.color}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}

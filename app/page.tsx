import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import Hero from '@/components/Hero';

async function getProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .gt('stock', 0) // Solo productos con stock mayor a 0
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products as Product[];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <Hero />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-20">
        {/* Categorías */}
        <div className="mb-16">
          <div className="flex gap-4 overflow-x-auto pb-4 mb-12 justify-center">
            <button className="px-8 py-3 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap">
              TODO
            </button>
            <button className="px-8 py-3 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap">
              REMERAS
            </button>
            <button className="px-8 py-3 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap">
              PANTALONES
            </button>
            <button className="px-8 py-3 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap">
              BUZOS
            </button>
            <button className="px-8 py-3 border-2 border-black font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap">
              CAMISAS
            </button>
          </div>
        </div>

        {/* Grid de Productos */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg uppercase tracking-wider">
              No hay productos disponibles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
            ¡SUSCRIBITE!
          </h2>
          <p className="text-lg font-light mb-8 uppercase tracking-wide">
            Recibí nuestras novedades y descuentos exclusivos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-6 py-4 bg-white text-black font-medium uppercase text-sm tracking-wider focus:outline-none"
            />
            <button className="px-10 py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors">
              ENVIAR
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

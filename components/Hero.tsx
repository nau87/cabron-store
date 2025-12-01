'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative h-[600px] overflow-hidden bg-zinc-900">
      {/* Background image con CSS */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay para oscurecer */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>

      {/* Contenido */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Cabrón Store"
            width={400}
            height={100}
            priority
            className="drop-shadow-2xl"
          />
        </div>

        <p className="text-2xl text-white mb-8 max-w-2xl font-light tracking-wide">
          Indumentaria masculina con actitud
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <span className="px-6 py-3 bg-white text-black font-bold text-lg tracking-wider">
            30% OFF TRANSFERENCIA
          </span>
          <span className="px-6 py-3 bg-white text-black font-bold text-lg tracking-wider">
            ENVÍO GRATIS +$150.000
          </span>
        </div>
      </div>
    </div>
  );
}

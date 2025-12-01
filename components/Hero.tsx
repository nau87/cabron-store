'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Gradient fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
        {/* Background image */}
        <Image
          src="/hero-bg.jpg"
          alt="Hero background"
          fill
          className="object-cover brightness-75"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

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

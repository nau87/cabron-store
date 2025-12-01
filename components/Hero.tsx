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
        
        <p className="text-white text-4xl font-light tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-bebas)' }}>
          Spring / Summer Session
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1.5 seconds display time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F0F23] animate-in fade-in duration-500 overflow-hidden">
      {/* Responsive Logo Container */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 mb-4 filter drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <Image
          src="/images/_CJL-ProfileAccount_BW2.jpg"
          alt="The Show Pro Series"
          fill
          priority
          style={{ objectFit: "contain" }}
          className="rounded-full"
        />
      </div>

      {/* Branding Phrase */}
      <div className="overflow-hidden">
        <p 
          className="text-white text-3xl md:text-4xl tracking-[0.2em] text-center mt-4 lowercase animate-in slide-in-from-bottom-4 duration-700 delay-300"
          style={{ fontFamily: "'Simplifica', sans-serif", fontWeight: 'normal' }}
        >
          científico de tu juego
        </p>
      </div>


      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-primary/10 to-transparent pointer-events-none opacity-50" />
    </div>
  );
}

import React from 'react';
import type { PromoConfig } from '../config/promoConfig';

type Props = {
  promo: PromoConfig | null;
};

export function PromoBanner({ promo }: Props) {
  if (!promo) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white px-4 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-sm sm:text-base font-medium text-center">
        <span className="flex items-center gap-2 flex-wrap justify-center">
          <span>🎉</span>
          <span>{promo.message}</span>
          <span className="font-black tracking-widest bg-white/20 rounded px-2 py-0.5">
            {promo.code}
          </span>
        </span>
        <a
          href={promo.ctaHref}
          className="underline underline-offset-2 font-semibold hover:text-white/80 transition-colors whitespace-nowrap"
        >
          {promo.ctaLabel} →
        </a>
      </div>
    </div>
  );
}

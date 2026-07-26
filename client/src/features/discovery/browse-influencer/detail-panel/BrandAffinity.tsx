import React from 'react';
import { WeightedItem } from '../types';
import { topN, pct } from '../utils';

interface BrandAffinityProps {
  items: WeightedItem[];
}

export const BrandAffinity = React.memo<BrandAffinityProps>(({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold mb-3">Brand affinity</h2>
      
      <div className="flex flex-wrap gap-2">
        {topN(items, 20).map((brand, i) => (
          <span 
            key={i} 
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800"
          >
            {brand.name || brand.code || "—"}
            {typeof brand.weight === 'number' && (
              <span className="text-gray-500"> · {pct(brand.weight)}</span>
            )}
          </span>
        ))}
      </div>
    </section>
  );
});

BrandAffinity.displayName = 'BrandAffinity';
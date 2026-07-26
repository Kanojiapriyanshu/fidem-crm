import React from 'react';
import { Audience, WeightedItem } from '../types';
import { topN, titleCase, nfmt, pct } from '../utils';

interface AudienceDistributionProps {
  audience?: Audience;
}

export const AudienceDistribution = React.memo<AudienceDistributionProps>(({ audience }) => {
  if (!audience) return null;
  
  const hasAnyDistribution = (
    topN(audience.genders, 3).length > 0 || 
    topN(audience.ages, 6).length > 0 || 
    topN(audience.geoCountries, 6).length > 0 || 
    topN(audience.languages, 6).length > 0 || 
    topN(audience.ethnicities, 6).length > 0 || 
    topN(audience.audienceTypes, 6).length > 0 || 
    topN(audience.audienceReachability, 6).length > 0
  );

  if (!hasAnyDistribution) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4">
      <h2 className="text-base font-semibold">Audience breakdown</h2>
      
      {topN(audience.genders, 3).length > 0 && (
        <DistributionBlock 
          title="Genders" 
          items={topN(audience.genders, 3)} 
          formatLabel={(item) => item.name || item.code || "—"} 
        />
      )}
      
      {topN(audience.ages, 6).length > 0 && (
        <DistributionBlock 
          title="Ages" 
          items={topN(audience.ages, 6)} 
          formatLabel={(item) => item.name || item.code || "—"} 
        />
      )}
      
      {topN(audience.geoCountries, 6).length > 0 && (
        <DistributionBlock 
          title="Top countries" 
          items={topN(audience.geoCountries, 6)} 
          formatLabel={(item) => item.name || item.code || "—"} 
        />
      )}
      
      {topN(audience.languages, 6).length > 0 && (
        <DistributionBlock 
          title="Languages" 
          items={topN(audience.languages, 6)} 
          formatLabel={(item) => item.name || item.code || "—"} 
        />
      )}
      
      {topN(audience.ethnicities, 6).length > 0 && (
        <DistributionBlock 
          title="Ethnicities" 
          items={topN(audience.ethnicities, 6)} 
          formatLabel={(item) => item.name || item.code || "—"} 
        />
      )}
      
      {topN(audience.audienceTypes, 6).length > 0 && (
        <DistributionBlock 
          title="Audience types" 
          items={topN(audience.audienceTypes, 6)} 
          formatLabel={(item) => titleCase(item.code || item.name || "")} 
        />
      )}
      
      {topN(audience.audienceReachability, 6).length > 0 && (
        <DistributionBlock 
          title="Reachability" 
          items={topN(audience.audienceReachability, 6)} 
          formatLabel={(item) => item.code || item.name || "—"} 
        />
      )}
    </section>
  );
});

AudienceDistribution.displayName = 'AudienceDistribution';

interface DistributionBlockProps {
  title: string;
  items: WeightedItem[];
  formatLabel: (item: WeightedItem) => string;
}

const DistributionBlock: React.FC<DistributionBlockProps> = ({ 
  title, 
  items, 
  formatLabel 
}) => (
  <div>
    <div className="text-xs text-gray-500 mb-2">{title}</div>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2 truncate text-sm">
            {formatLabel(item)}
          </div>
          <div className="col-span-2">
            <WeightBar weight={item.weight} />
          </div>
          <div className="text-right text-sm text-gray-600">
            {pct(item.weight)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface WeightBarProps {
  weight?: number;
}

const WeightBar: React.FC<WeightBarProps> = ({ weight }) => {
  const w = Math.max(0, Math.min(1, Number(weight || 0)));
  
  return (
    <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
      <div 
        className="h-full bg-orange-400 transition-all duration-300" 
        style={{ width: `${w * 100}%` }} 
      />
    </div>
  );
};
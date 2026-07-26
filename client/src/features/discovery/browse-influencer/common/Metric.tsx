import React from 'react';

interface MetricProps { label: string; value: React.ReactNode; small?: boolean }
export const Metric = React.memo<MetricProps>(({ label, value, small = false }) => (
  <div className={`rounded-xl border border-gray-200 ${small ? 'p-3' : 'p-4'} bg-white`}>
    <div className={`${small ? 'text-[11px]' : 'text-xs'} text-gray-500 mb-1`}>{label}</div>
    <div className={`${small ? 'text-sm' : 'text-base'} font-semibold`}>{value}</div>
  </div>
));
Metric.displayName = 'Metric';
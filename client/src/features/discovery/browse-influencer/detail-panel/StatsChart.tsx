import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatHistoryEntry } from '../types';

interface StatsChartProps {
  statHistory: StatHistoryEntry[];
}

export const StatsChart = React.memo<StatsChartProps>(({ statHistory }) => {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold mb-3">Last 12 months — Avg Engagements</h2>
      {statHistory && statHistory.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={statHistory} 
              margin={{ left: 6, right: 6, top: 18, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
              />
              <ReTooltip />
              <Line 
                type="monotone" 
                dataKey="avgEngagements" 
                strokeWidth={2} 
                dot={false}
                stroke="#FFA135"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
    </section>
  );
});

StatsChart.displayName = 'StatsChart';

const EmptyChart: React.FC = () => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
    No stat history available
  </div>
);
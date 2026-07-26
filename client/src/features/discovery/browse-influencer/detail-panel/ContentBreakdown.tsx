import React, { useMemo } from 'react';
import { Platform, ReportResponse } from '../types';
import { getMedian , nfmt } from '../utils';

interface ContentBreakdownProps {
  data: ReportResponse;
  platform: Platform | null;
}

export const ContentBreakdown = React.memo<ContentBreakdownProps>(({ data, platform }) => {
  const contentAggRows = useMemo(() => {
    if (!data?.profile?.statsByContentType) return [];
    
    const sbc = data.profile.statsByContentType as any;
    const rows: Array<{ 
      key: string; 
      label: string; 
      total?: number; 
      medLikes?: number; 
      medComments?: number; 
      medViews?: number 
    }> = [];
    
    const pushRow = (key: string, label: string) => {
      const c = sbc[key];
      const agg = c?.agg;
      if (!agg) return;
      
      rows.push({ 
        key, 
        label, 
        total: agg.total, 
        medLikes: getMedian(agg, "likes"), 
        medComments: getMedian(agg, "comments"), 
        medViews: getMedian(agg, "views") 
      });
    };
    
    if (platform === "instagram") {
      pushRow("posts", "Posts");
      pushRow("reels", "Reels");
    } else if (platform === "tiktok") {
      pushRow("videos", "Videos");
      pushRow("shorts", "Short videos");
    } else if (platform === "youtube") {
      pushRow("videos", "Videos");
      pushRow("shorts", "Shorts");
      pushRow("streams", "Streams");
    }
    
    return rows.filter((r) => 
      r.total != null || r.medLikes != null || r.medComments != null || r.medViews != null
    );
  }, [data, platform]);

  if (contentAggRows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Content breakdown (medians)</h2>
        <span className="text-xs text-gray-500">From Modash aggregates</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Median likes</th>
              <th className="py-2 pr-3">Median comments</th>
              <th className="py-2 pr-3">Median views</th>
            </tr>
          </thead>
          <tbody>
            {contentAggRows.map((row) => (
              <tr key={row.key} className="border-t border-gray-100">
                <td className="py-2 pr-3 font-medium">{row.label}</td>
                <td className="py-2 pr-3">{nfmt(row.total)}</td>
                <td className="py-2 pr-3">{nfmt(row.medLikes)}</td>
                <td className="py-2 pr-3">{nfmt(row.medComments)}</td>
                <td className="py-2 pr-3">{nfmt(row.medViews)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});

ContentBreakdown.displayName = 'ContentBreakdown';
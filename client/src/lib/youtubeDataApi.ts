export type YouTubeCreatorFilters = {
    campaignId?: string;
    keyword?: string;
    country?: string;
    category?: string;
    categoryId?: string;
    subscriberTier?: string;
    minSubscribers?: string | number;
    maxSubscribers?: string | number;
    minAvgViews?: string | number;
    minEngagement?: string | number;
    budgetMin?: string | number;
    budgetMax?: string | number;
    sort?: string;
    page?: string | number;
    limit?: string | number;
  };
  
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000/api';
  
  const ALLOWED_QUERY_KEYS = new Set([
    'campaignId',
    'keyword',
    'country',
    'category',
    'categoryId',
    'subscriberTier',
    'minSubscribers',
    'maxSubscribers',
    'minAvgViews',
    'minEngagement',
    'budgetMin',
    'budgetMax',
    'sort',
    'page',
    'limit',
  ]);
  
  function cleanParams(filters: YouTubeCreatorFilters = {}) {
    const params = new URLSearchParams();
  
    Object.entries(filters).forEach(([key, value]) => {
      if (!ALLOWED_QUERY_KEYS.has(key)) return;
  
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
  
    return params;
  }
  
  export async function fetchYouTubeCreators(filters: YouTubeCreatorFilters = {}) {
    const params = cleanParams(filters);
  
    const res = await fetch(`${API_BASE_URL}/youtube-data/creators?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
  
    const data = await res.json().catch(() => ({}));
  
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to load YouTube creators');
    }
  
    return data;
  }
  
  export async function fetchYouTubeMediaKit(channelId: string) {
    const res = await fetch(`${API_BASE_URL}/youtube-data/creators/${channelId}/media-kit`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
  
    const data = await res.json().catch(() => ({}));
  
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to load media kit');
    }
  
    return data.data;
  }
  
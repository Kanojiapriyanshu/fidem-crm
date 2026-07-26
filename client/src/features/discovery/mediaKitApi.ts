// Minimal media-kit/creator API helpers for Fidem.
// Extracted from the old influencer-portal service (services/influencerApi.ts)
// down to just what the admin-side media kit viewer (ViewModashClient) needs —
// Fidem has no influencer accounts, so everything else in that file (campaign
// applications, contracts, milestones, etc.) was dropped.

import { post } from "@/lib/api";

function authHeader(token?: string) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Past collaborations for a creator. There's no campaigns marketplace in
 * Fidem, so this will simply return an empty/error result — callers should
 * treat that as "no past collaborations" rather than a hard failure.
 */
export const apiGetContractedCampaigns = (influencerId: string, token?: string) => {
  return post<any[]>(
    `/campaign/contracted`,
    { influencerId, limit: 10, pagination: 1, search: "" },
    { headers: { ...authHeader(token) } }
  );
};

export const apiGetfetchMediaKit = (influencerId: string) => {
  return post<any>(`/media-kit/influencer`, { influencerId });
};

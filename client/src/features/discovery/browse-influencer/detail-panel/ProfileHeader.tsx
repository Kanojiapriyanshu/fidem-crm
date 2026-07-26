import React from 'react';
import { CheckCircle2, Lock, User as UserIcon, PlayCircle, ThumbsUp, Star } from 'lucide-react';
import { Platform, InfluencerProfile } from '../types';
import { nfmt, pfmt } from '../utils';
import { Metric } from '../common/Metric';

interface ProfileHeaderProps {
  profile: InfluencerProfile;
  platform: Platform | null;
}

export const ProfileHeader = React.memo<ProfileHeaderProps>(({ profile, platform }) => {
  const header = profile.profile;
  
  return (
    <div className="mb-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {header?.picture ? (
          <img 
            src={header.picture} 
            alt={header.fullname || header.username} 
            className="h-20 w-20 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="truncate text-xl font-bold">
              {header?.fullname || header?.username || profile.userId}
            </h1>
            
            {platform === "youtube" && header?.handle && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {header.handle}
              </span>
            )}
            
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                <CheckCircle2 className="h-4 w-4" /> Verified
              </span>
            )}
            
            {profile.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                <Lock className="h-4 w-4" /> Private
              </span>
            )}
          </div>
          
          {/* Profile Link */}
          <div className="text-sm text-gray-600 truncate">
            {header?.username} · {" "}
            {header?.url ? (
              <a 
                className="underline hover:no-underline" 
                href={header.url} 
                target="_blank" 
                rel="noreferrer"
              >
                Profile
              </a>
            ) : (
              "—"
            )}
          </div>

          {/* Main Metrics */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2">
            <Metric label="Followers" value={nfmt(header?.followers)} />
            <Metric label="Engagement rate" value={pfmt(header?.engagementRate)} />
            <Metric label="Avg likes" value={nfmt(profile.avgLikes)} />
            <Metric label="Avg comments" value={nfmt(profile.avgComments)} />
            
            {platform === "instagram" ? (
              profile.averageViews ? (
                <Metric label="Avg views" value={nfmt(profile.averageViews)} />
              ) : (
                <Metric label="Posts (4w)" value={nfmt(profile.statsByContentType?.all?.avgPosts4weeks)} />
              )
            ) : (
              <Metric label="Avg views" value={nfmt(profile.averageViews)} />
            )}
            
            {typeof profile.postsCount === "number" && (
              <Metric label="Posts" value={nfmt(profile.postsCount)} />
            )}
          </div>

          {/* Additional Metrics */}
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {platform === "youtube" && (
              <Metric 
                small 
                label="Total views" 
                value={
                  <span className="inline-flex items-center gap-1">
                    <PlayCircle className="h-3.5 w-3.5" />
                    {nfmt(profile.totalViews)}
                  </span>
                } 
              />
            )}
            
            {platform === "tiktok" && (
              <Metric 
                small 
                label="Total likes" 
                value={
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {nfmt(profile.totalLikes)}
                  </span>
                } 
              />
            )}
            
            {typeof profile.avgReelsPlays === "number" && (
              <Metric small label="Avg reels plays" value={nfmt(profile.avgReelsPlays)} />
            )}
            
            {profile.language?.name && (
              <Metric 
                small 
                label="Language" 
                value={profile.language?.name || profile.language?.code || "—"} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
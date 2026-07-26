import React from 'react';
import { Youtube, Instagram, Music4 } from 'lucide-react';
import { Platform, PlatformTheme } from '../platform';

export const platformTheme: Record<Platform, PlatformTheme> = {
  youtube: {
    label: 'YouTube',
    color: 'bg-gradient-to-r from-red-600 to-red-500',
    ring: 'ring-red-500',
    icon: <Youtube className="h-4 w-4" />
  },
  tiktok: {
    label: 'TikTok',
    color: 'bg-gradient-to-r from-gray-900 to-gray-800',
    ring: 'ring-gray-500',
    icon: <Music4 className="h-4 w-4" />
  },
  instagram: {
    label: 'Instagram',
    color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
    ring: 'ring-pink-500',
    icon: <Instagram className="h-4 w-4" />
  }
};

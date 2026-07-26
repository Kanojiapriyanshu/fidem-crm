export type Platform = 'youtube' | 'tiktok' | 'instagram';

export interface PlatformTheme {
  label: string;
  color: string;
  ring: string;
  icon: React.ReactNode;
}
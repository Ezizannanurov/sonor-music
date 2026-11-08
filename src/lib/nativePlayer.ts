import { registerPlugin } from '@capacitor/core';

export interface NativeTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  url: string;
  duration?: number;
}

export interface MediaPlaybackPlugin {
  play(options: {
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    url: string;
    duration?: number;
    index?: number;
    queue?: NativeTrack[];
  }): Promise<{ success: boolean }>;
  pause(): Promise<{ success: boolean }>;
  resume(): Promise<{ success: boolean }>;
  next(): Promise<{ success: boolean }>;
  prev(): Promise<{ success: boolean }>;
  seekTo(options: { position: number }): Promise<{ success: boolean }>;
  setSpeed(options: { speed: number }): Promise<{ success: boolean }>;
  setVolume(options: { volume: number }): Promise<{ success: boolean }>;
  getPlaybackState(): Promise<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    currentTrack?: NativeTrack;
    currentIndex?: number;
  }>;
  cacheTrack(options: { id: string; url: string }): Promise<{ success: boolean; path: string }>;
  isCached(options: { id: string }): Promise<{ isCached: boolean; path?: string }>;
  getCachedTracks(): Promise<{ cachedIds: string[] }>;
  removeCachedTrack(options: { id: string }): Promise<{ success: boolean }>;
  addListener(
    eventName: 'playbackStateChange',
    listener: (data: { isPlaying: boolean; currentTime: number; duration: number }) => void
  ): Promise<any>;
  addListener(
    eventName: 'trackChange',
    listener: (data: { id: string; title: string; artist: string; artwork?: string; duration: number; index: number }) => void
  ): Promise<any>;
  addListener(
    eventName: 'timeUpdate',
    listener: (data: { isPlaying: boolean; currentTime: number; duration: number }) => void
  ): Promise<any>;
}

export const MediaPlayback = registerPlugin<MediaPlaybackPlugin>('MediaPlayback');

export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

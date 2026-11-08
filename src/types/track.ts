export interface Track {
  id: string;
  title: string;
  artist: string;
  source: 'soundcloud' | 'spotify' | 'youtube';
  duration: number; // in seconds
  thumbnail: string;
  streamUrl?: string; // audio source URL or stream endpoint
  externalUrl?: string;
}

export type PlaybackSpeed = 0.75 | 0.85 | 1.0 | 1.15 | 1.25 | 1.5;

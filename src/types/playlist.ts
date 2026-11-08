import { Track } from './track';

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverColor: string;
  coverImage?: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

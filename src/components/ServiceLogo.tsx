import React from 'react';

export function SpotifyLogo({ className = 'w-3.5 h-3.5', color = '#1DB954' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-label="Spotify" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.298c-.216.353-.673.468-1.026.252-2.812-1.718-6.352-2.107-10.52-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.567-1.042 8.475-.6 11.629 1.338.353.216.468.673.252 1.026zm1.463-3.254c-.272.443-.852.585-1.295.313-3.219-1.978-8.126-2.55-11.932-1.394-.499.151-1.028-.135-1.18-.634-.15-.499.136-1.028.635-1.18 4.356-1.322 9.772-.684 13.46 1.58.442.272.584.852.312 1.295zm.126-3.41c-3.86-2.292-10.23-2.503-13.914-1.385-.592.18-1.22-.163-1.4-.755-.18-.592.163-1.22.755-1.4 4.238-1.286 11.28-1.038 15.728 1.602.532.316.707 1.004.391 1.536-.316.532-1.004.707-1.56.402z" />
    </svg>
  );
}

export function SoundCloudLogo({ className = 'w-3.5 h-3.5', color = '#FF5500' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-label="SoundCloud" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.175 12.225c-.093 0-.175.08-.175.175v4.55c0 .095.082.175.175.175.093 0 .175-.08.175-.175V12.4c0-.095-.082-.175-.175-.175zm1.175-1.575c-.1 0-.175.08-.175.175v7.7c0 .095.075.175.175.175.094 0 .175-.08.175-.175v-7.7c0-.095-.081-.175-.175-.175zm1.175-.875c-.1 0-.175.08-.175.175v9.45c0 .095.075.175.175.175.094 0 .175-.08.175-.175v-9.45c0-.095-.081-.175-.175-.175zm1.175-.7c-.1 0-.175.08-.175.175v10.85c0 .095.075.175.175.175.094 0 .175-.08.175-.175V9.25c0-.095-.081-.175-.175-.175zm1.175-.525c-.1 0-.175.08-.175.175v11.9c0 .095.075.175.175.175.094 0 .175-.08.175-.175v-11.9c0-.095-.081-.175-.175-.175zm1.175-.175c-.1 0-.175.08-.175.175v12.25c0 .095.075.175.175.175.094 0 .175-.08.175-.175V8.55c0-.095-.081-.175-.175-.175zm1.175 0c-.1 0-.175.08-.175.175v12.25c0 .095.075.175.175.175.094 0 .175-.08.175-.175V8.55c0-.095-.081-.175-.175-.175zm1.175.175c-.1 0-.175.08-.175.175v12.075c0 .095.075.175.175.175.094 0 .175-.08.175-.175V8.725c0-.095-.081-.175-.175-.175zm1.175.525c-.1 0-.175.08-.175.175v11.55c0 .095.075.175.175.175.094 0 .175-.08.175-.175V9.25c0-.095-.081-.175-.175-.175zm3.85-2.625c-1.34 0-2.48.74-3.08 1.83-.2-.07-.41-.11-.63-.11-.12 0-.24.01-.35.04v11.92c.39.09.8.14 1.22.14h8.4c2.65 0 4.8-2.15 4.8-4.8 0-2.53-1.96-4.6-4.45-4.78-.45-2.43-2.58-4.24-5.11-4.24z" />
    </svg>
  );
}

export function YouTubeMusicLogo({ className = 'w-3.5 h-3.5', color = '#FF0000' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="YouTube Music" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill={color} />
      <circle cx="12" cy="12" r="7.4" fill="none" stroke="#FFFFFF" strokeWidth="2.1" />
      <polygon points="10.2,8.6 15.4,12 10.2,15.4" fill="#FFFFFF" />
    </svg>
  );
}

export interface ServiceLogoProps {
  source: 'spotify' | 'soundcloud' | 'youtube' | string;
  className?: string;
}

export default function ServiceLogo({ source, className = 'w-3.5 h-3.5' }: ServiceLogoProps) {
  switch (source.toLowerCase()) {
    case 'spotify':
      return <SpotifyLogo className={className} />;
    case 'soundcloud':
      return <SoundCloudLogo className={className} />;
    case 'youtube':
    case 'youtubemusic':
    case 'youtube music':
      return <YouTubeMusicLogo className={className} />;
    default:
      return null;
  }
}

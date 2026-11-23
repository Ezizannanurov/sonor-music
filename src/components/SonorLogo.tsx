import React from 'react';

interface SonorLogoProps {
  className?: string;
  size?: number;
}

export const SonorLogo: React.FC<SonorLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sonor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <radialGradient id="sonor-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dark rounded container with subtle border */}
      <rect width="48" height="48" rx="14" fill="#09090e" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="url(#sonor-glow)" />

      {/* Left and Right Sonar Arcs */}
      <path
        d="M10 18C8.5 21.5 8.5 26.5 10 30"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <path
        d="M38 18C39.5 21.5 39.5 26.5 38 30"
        stroke="#ec4899"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* 5 Core Frequency Bars */}
      {/* Bar 1 */}
      <rect x="14" y="20" width="3" height="10" rx="1.5" fill="#38bdf8" />
      {/* Bar 2 */}
      <rect x="19" y="15" width="3" height="19" rx="1.5" fill="#60a5fa" />
      {/* Bar 3 (Center) */}
      <rect x="24" y="11" width="3" height="26" rx="1.5" fill="url(#sonor-grad)" />
      {/* Bar 4 */}
      <rect x="29" y="15" width="3" height="19" rx="1.5" fill="#c084fc" />
      {/* Bar 5 */}
      <rect x="34" y="20" width="3" height="10" rx="1.5" fill="#f472b6" />
    </svg>
  );
};

export default SonorLogo;

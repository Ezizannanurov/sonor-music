'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { PlaylistProvider } from '@/context/PlaylistContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlaylistProvider>
        {children}
      </PlaylistProvider>
    </AuthProvider>
  );
}

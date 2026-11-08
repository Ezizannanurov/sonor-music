import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fm.sonor.music',
  appName: 'Sonor Music',
  webDir: 'public',
  server: {
    url: 'https://sonor-music-ubvp.onrender.com',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
  },
};

export default config;

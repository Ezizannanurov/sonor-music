'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Loader2, ListMusic, Trash2, X, Activity, Palette, Plus, Music, Play, Smartphone, Sparkles,
  ArrowDownToLine, CheckCircle2, HardDriveDownload, WifiOff
} from 'lucide-react';
import { Track } from '@/types/track';
import { TrackCard } from '@/components/TrackCard';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import { BottomNav, NavTab } from '@/components/BottomNav';
import JellyRadio from '@/components/JellyRadio';
import Scanner from '@/components/Scanner';
import GradualBlur from '@/components/GradualBlur';
import ScrollReveal from '@/components/ScrollReveal';
import ServiceLogo from '@/components/ServiceLogo';
import ThemeModal from '@/components/ThemeModal';
import ShinyText from '@/components/ShinyText';
import ClickSpark from '@/components/ClickSpark';
import { UserMenu } from '@/components/UserMenu';
import { AuthModal } from '@/components/AuthModal';
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { AddToPlaylistModal } from '@/components/AddToPlaylistModal';
import { PlaylistView } from '@/components/PlaylistView';
import { HomeRecentlyPlayed } from '@/components/HomeRecentlyPlayed';
import { HomePersonalMixes, PersonalMix } from '@/components/HomePersonalMixes';
import { HomeMoodGrid, MoodCategory } from '@/components/HomeMoodGrid';
import { HomePopularArtists, PopularArtist, PopularAlbum } from '@/components/HomePopularArtists';
import { useAuth } from '@/context/AuthContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { 
  getAllOfflineTracks, 
  saveTrackOffline, 
  deleteOfflineTrack, 
  clearAllOfflineTracks, 
  getOfflineAudioUrl
} from '@/lib/offlineStorage';
import { MediaPlayback, isNativeApp } from '@/lib/nativePlayer';

const GENRES = ['Phonk', 'Synthwave', 'Hip-Hop', 'Nightcore', 'Lo-Fi', 'Rock'];

export default function App() {
  const { user, isAuthModalOpen, closeAuthModal } = useAuth();
  const {
    playlists,
    deletePlaylist,
    removeTrackFromPlaylist,
    trackToAddToPlaylist,
    setTrackToAddToPlaylist,
    isCreateModalOpen,
    setIsCreateModalOpen,
    activePlaylist,
    setActivePlaylist,
  } = usePlaylist();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const tabHistoryRef = useRef<NavTab[]>(['home']);

  const switchTab = (newTab: NavTab) => {
    if (newTab !== currentTab) {
      tabHistoryRef.current.push(newTab);
      setCurrentTab(newTab);
    }
  };
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Phonk');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'soundcloud' | 'spotify' | 'youtube'>('all');
  
  // Theme state
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Lists
  const [homeTracks, setHomeTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [activeHomeCategoryTitle, setActiveHomeCategoryTitle] = useState<string>('Рекомендации для вас');
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  
  // Offline & Library state
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineAlert, setOfflineAlert] = useState<string | null>(null);
  const [libraryTab, setLibraryTab] = useState<'playlists' | 'favorites' | 'downloads' | 'queue'>('playlists');
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Audio Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [speed, setSpeed] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map((x) => x + x).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const applyTheme = (color: string) => {
    setThemeColor(color);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pulse_accent_color', color);
        const root = document.documentElement;
        root.style.setProperty('--accent-color', color);
        root.style.setProperty('--accent-glow', hexToRgba(color, 0.45));
        root.style.setProperty('--accent-subtle', hexToRgba(color, 0.14));
      } catch {
        // ignore
      }
    }
  };

  // Scoped favorites, queue & recent tracks key per user
  const favKey = user ? `pulse_favs_${user.id}` : 'pulse_favs_guest';
  const queueKey = user ? `pulse_queue_${user.id}` : 'pulse_queue_guest';
  const recentKey = user ? `pulse_recent_${user.id}` : 'pulse_recent_guest';

  useEffect(() => {
    try {
      const savedColor = localStorage.getItem('pulse_accent_color');
      if (savedColor) {
        applyTheme(savedColor);
      }

      const savedFavs = localStorage.getItem(favKey);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      } else {
        setFavorites([]);
      }

      const savedQueue = localStorage.getItem(queueKey);
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue));
      } else {
        setQueue([]);
      }

      const savedRecent = localStorage.getItem(recentKey);
      if (savedRecent) {
        setRecentTracks(JSON.parse(savedRecent));
      } else {
        // Initial seed with high quality tracks if user has no listening history yet
        const defaultRecent: Track[] = [
          {
            id: 'rec-1',
            title: 'Nerves (feat. Atsuover)',
            artist: 'Beanie Bopper & Atsuover',
            source: 'spotify',
            duration: 113,
            thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e9/bc/3b/e9bc3bec-42b8-9e43-76e5-8fc107b3bcd3/artwork.jpg/600x600bb.jpg',
            streamUrl: '/api/stream/youtube?id=2rOi1fy954E&title=Friday%20night%20funkin%20Hazy%20river%20OST%20-%20Nerves&artist=Atsuover',
          },
          {
            id: 'rec-2',
            title: 'Close Eyes',
            artist: 'DVRST',
            source: 'spotify',
            duration: 132,
            thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f2/c9/7f/f2c97f51-f479-6036-ada1-f23bd60b160e/0.jpg/600x600bb.jpg',
            streamUrl: '/api/stream/youtube?id=1-xGerv5FOk&title=DVRST%20-%20Close%20Eyes&artist=DVRST',
          },
          {
            id: 'rec-3',
            title: 'Murder In My Mind',
            artist: 'Kordhell',
            source: 'spotify',
            duration: 145,
            thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7a/de/1c/7ade1c79-db22-f0f1-6962-c390fa2c80f7/199999370628.png/600x600bb.jpg',
            streamUrl: '/api/stream/youtube?id=w-sQRS-Um98&title=Kordhell%20-%20Murder%20In%20My%20Mind&artist=Kordhell',
          },
          {
            id: 'rec-4',
            title: 'After Hours',
            artist: 'The Weeknd',
            source: 'spotify',
            duration: 361,
            thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
            streamUrl: '/api/stream/youtube?id=ygTZZpVHNfc&title=The%20Weeknd%20-%20After%20Hours&artist=The%20Weeknd',
          },
        ];
        setRecentTracks(defaultRecent);
      }
    } catch {
      // ignore
    }

    // Load offline tracks from IndexedDB immediately
    getAllOfflineTracks().then((cached) => {
      setOfflineTracks(cached);
    }).catch(console.error);

    // Instantly load cached home tracks from localStorage so UI is immediately usable
    try {
      const cachedHome = localStorage.getItem('sonor_cached_home_tracks');
      if (cachedHome) {
        const parsed = JSON.parse(cachedHome);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeTracks(parsed);
        }
      }
    } catch {}

    // Network connectivity tracking
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    loadHomeContent();
  }, [user?.id]);

  const loadHomeContent = async () => {
    // Only show loader if we have zero cached tracks
    if (homeTracks.length === 0) {
      setIsLoading(true);
    }
    try {
      const [resSpotify, resSc] = await Promise.allSettled([
        fetch('/api/search/spotify?q=Trending+Hits+2025').then((r) => r.json()),
        fetch('/api/search/soundcloud?q=Phonk').then((r) => r.json()),
      ]);

      let tracks: Track[] = [];
      if (resSpotify.status === 'fulfilled' && resSpotify.value.tracks) {
        tracks = [...tracks, ...resSpotify.value.tracks];
      }
      if (resSc.status === 'fulfilled' && resSc.value.tracks) {
        tracks = [...tracks, ...resSc.value.tracks];
      }

      if (tracks.length > 0) {
        setHomeTracks(tracks);
        try {
          localStorage.setItem('sonor_cached_home_tracks', JSON.stringify(tracks));
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreChange = async (genre: string) => {
    setSelectedGenre(genre);
    setIsLoading(true);
    try {
      const [resSpotify, resSc] = await Promise.allSettled([
        fetch(`/api/search/spotify?q=${encodeURIComponent(genre)}`).then((r) => r.json()),
        fetch(`/api/search/soundcloud?q=${encodeURIComponent(genre)}`).then((r) => r.json()),
      ]);

      let tracks: Track[] = [];
      if (resSpotify.status === 'fulfilled' && resSpotify.value.tracks) {
        tracks = [...tracks, ...resSpotify.value.tracks];
      }
      if (resSc.status === 'fulfilled' && resSc.value.tracks) {
        tracks = [...tracks, ...resSc.value.tracks];
      }

      setHomeTracks(tracks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      const updated = exists ? prev.filter((t) => t.id !== track.id) : [track, ...prev];
      localStorage.setItem(favKey, JSON.stringify(updated));
      return updated;
    });
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      const updated = [...prev, track];
      localStorage.setItem(queueKey, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromQueue = (trackId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      localStorage.setItem(queueKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isNativeApp()) {
      MediaPlayback.setSpeed({ speed: newSpeed }).catch(console.warn);
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isNativeApp()) {
      MediaPlayback.setVolume({ volume: newVolume }).catch(console.warn);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.playbackRate = speed;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [volume, speed, queue, currentTrack, repeatMode, isShuffle, activePlaylist, favorites, searchTracks, homeTracks]);

  // Mobile Lock Screen & Headphone Controls via MediaSession API
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'Sonor Music',
        artwork: currentTrack.thumbnail
          ? [
              { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/png' },
              { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/png' },
              { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/png' },
              { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/png' },
            ]
          : [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => handlePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => handlePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });
      } catch (err) {
        console.warn('MediaSession handler error:', err);
      }
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Android & Mobile Background WakeLock: keeps audio running even with screen locked
    if (isPlaying && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock?.request('screen').catch(() => {});
    }
  }, [currentTrack, isPlaying]);

  // Native Android Media Playback Synchronization & Event Listeners
  useEffect(() => {
    if (!isNativeApp()) return;

    MediaPlayback.getPlaybackState().then((state) => {
      if (state) {
        if (state.currentTrack && state.isPlaying) {
          setCurrentTrack({
            id: state.currentTrack.id,
            title: state.currentTrack.title,
            artist: state.currentTrack.artist,
            thumbnail: state.currentTrack.artwork || '',
            streamUrl: state.currentTrack.url,
            duration: state.duration || 0,
            source: 'youtube',
          });
          setIsPlaying(Boolean(state.isPlaying));
          if (state.currentTime) setCurrentTime(state.currentTime);
          if (state.duration) setDuration(state.duration);
        }
        if (state.repeatMode) {
          setRepeatMode(state.repeatMode);
        }
        if (state.isShuffle !== undefined) {
          setIsShuffle(Boolean(state.isShuffle));
        }
      }
    }).catch(console.warn);

    const subState = MediaPlayback.addListener('playbackStateChange', (data) => {
      setIsPlaying(data.isPlaying);
      if (data.currentTime !== undefined) setCurrentTime(data.currentTime);
      if (data.duration !== undefined) setDuration(data.duration);
    });

    const subTrack = MediaPlayback.addListener('trackChange', (data) => {
      setCurrentTrack({
        id: data.id,
        title: data.title,
        artist: data.artist,
        thumbnail: data.artwork || '',
        streamUrl: '',
        duration: data.duration || 0,
        source: 'youtube',
      });
      setIsPlaying(true);
      if (data.duration) setDuration(data.duration);
    });

    const subTime = MediaPlayback.addListener('timeUpdate', (data) => {
      if (data.currentTime !== undefined) setCurrentTime(data.currentTime);
      if (data.duration !== undefined) setDuration(data.duration);
    });

    return () => {
      subState.then((s) => s?.remove?.()).catch(() => {});
      subTrack.then((s) => s?.remove?.()).catch(() => {});
      subTime.then((s) => s?.remove?.()).catch(() => {});
    };
  }, []);

  // Hardware / Gesture Back Button handling for mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).handleHardwareBack = () => {
      // 1. If player is expanded, close it first
      if (isPlayerExpanded) {
        setIsPlayerExpanded(false);
        return true;
      }

      // 2. If queue drawer is open, close it
      if (isQueueOpen) {
        setIsQueueOpen(false);
        return true;
      }

      // 3. If any modal is open, close it
      if (isThemeOpen) {
        setIsThemeOpen(false);
        return true;
      }
      if (isAuthModalOpen) {
        closeAuthModal();
        return true;
      }
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
        return true;
      }
      if (trackToAddToPlaylist) {
        setTrackToAddToPlaylist(null);
        return true;
      }

      // 4. If viewing inside a playlist in library, exit back to library list
      if (activePlaylist) {
        setActivePlaylist(null);
        return true;
      }

      // 5. Navigate back to previous tab in history stack
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop();
        const prevTab = tabHistoryRef.current[tabHistoryRef.current.length - 1] || 'home';
        setCurrentTab(prevTab);
        return true;
      }

      // 6. If currently on any tab other than 'home', switch back to 'home'
      if (currentTab !== 'home') {
        setCurrentTab('home');
        tabHistoryRef.current = ['home'];
        return true;
      }

      // 7. Already at home with nothing open: return false to let Android minimize app
      return false;
    };
  }, [
    isPlayerExpanded,
    isQueueOpen,
    isThemeOpen,
    isAuthModalOpen,
    isCreateModalOpen,
    trackToAddToPlaylist,
    activePlaylist,
    currentTab,
    closeAuthModal,
    setIsCreateModalOpen,
    setTrackToAddToPlaylist,
    setActivePlaylist
  ]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  const handleSearch = async (overrideQuery?: string) => {
    const rawQ = overrideQuery ?? query;
    if (!rawQ.trim()) return;

    const trimmed = rawQ.trim();

    // Direct link support: paste any Spotify, YouTube or SoundCloud link to play immediately
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('spotify.com') ||
      trimmed.includes('spotify.link') ||
      trimmed.includes('youtu.be') ||
      trimmed.includes('youtube.com') ||
      trimmed.includes('soundcloud.com')
    ) {
      setIsLoading(true);
      try {
        const linkRes = await fetch(`/api/search/link?url=${encodeURIComponent(trimmed)}`).then((r) => r.json());
        if (linkRes.tracks && linkRes.tracks.length > 0) {
          setSearchTracks(linkRes.tracks);
          handlePlayTrack(linkRes.tracks[0]);
          return;
        }
      } catch (err) {
        console.warn('Direct link search error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    // Clean punctuation and fix common artist typos automatically
    const q = rawQ
      .replace(/[\-_,;:|/\\+()\[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\bautsover\b/gi, 'atsuover')
      .replace(/\bragemine\b/gi, 'rageminer')
      .trim();

    setIsLoading(true);
    let combined: Track[] = [];

    try {
      const promises: Promise<any>[] = [];

      if (sourceFilter === 'all' || sourceFilter === 'spotify') {
        promises.push(
          fetch(`/api/search/spotify?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((d) => d.tracks || [])
            .catch(() => [])
        );
      }

      if (sourceFilter === 'all' || sourceFilter === 'soundcloud') {
        promises.push(
          fetch(`/api/search/soundcloud?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((d) => d.tracks || [])
            .catch(() => [])
        );
      }

      if (sourceFilter === 'all' || sourceFilter === 'youtube') {
        promises.push(
          fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((d) => d.tracks || [])
            .catch(() => [])
        );
      }

      const results = await Promise.all(promises);
      if (sourceFilter === 'all') {
        const maxLen = Math.max(...results.map((r: any[]) => r.length), 0);
        const interleaved: Track[] = [];
        for (let i = 0; i < maxLen; i++) {
          for (const resList of results) {
            if (resList[i]) interleaved.push(resList[i]);
          }
        }
        combined = interleaved;
      } else {
        combined = results.flat();
      }

      // Rank tracks that match both title and artist keywords to the top
      const qTokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (qTokens.length > 1) {
        combined.sort((a, b) => {
          const aText = `${a.title} ${a.artist}`.toLowerCase();
          const bText = `${b.title} ${b.artist}`.toLowerCase();
          const aMatches = qTokens.filter((t) => aText.includes(t)).length;
          const bMatches = qTokens.filter((t) => bText.includes(t)).length;
          return bMatches - aMatches;
        });
      }

      setSearchTracks(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        if (isNativeApp()) {
          MediaPlayback.pause().catch(console.warn);
        } else {
          audioRef.current?.pause();
        }
        setIsPlaying(false);
      } else {
        if (isNativeApp()) {
          MediaPlayback.resume().catch(console.warn);
        } else {
          audioRef.current?.play();
        }
        setIsPlaying(true);
      }
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);

    // Update recent tracks history
    setRecentTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 18);
      try {
        localStorage.setItem(recentKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    let playUrl = '';
    try {
      const offlineUrl = await getOfflineAudioUrl(track.id);
      if (offlineUrl) {
        playUrl = offlineUrl;
      }
    } catch {}

    if (!playUrl) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setOfflineAlert('Этот трек ещё не скачан для офлайн-прослушивания. Подключитесь к интернету или выберите трек из вкладки «Офлайн».');
        setTimeout(() => setOfflineAlert(null), 5000);
        setIsPlaying(false);
        return;
      }

      playUrl = track.streamUrl || '';
      if (!playUrl.startsWith('/api/stream') && !playUrl.startsWith('blob:')) {
        if (!playUrl || playUrl.includes('apple.com') || track.source === 'spotify') {
          playUrl = `/api/stream?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&preview=${encodeURIComponent(track.streamUrl || '')}`;
        }
      }
    }

    if (isNativeApp()) {
      const backendBase = 'https://sonor-music-ubvp.onrender.com';
      const fullPlayUrl = playUrl.startsWith('http') || playUrl.startsWith('file:')
        ? playUrl
        : `${backendBase}${playUrl.startsWith('/') ? '' : '/'}${playUrl}`;

      const activeList =
        currentTab === 'library'
          ? (activePlaylist ? activePlaylist.tracks : favorites)
          : currentTab === 'search'
          ? searchTracks
          : homeTracks;
      const currIdx = activeList.findIndex((t) => t.id === track.id);

      MediaPlayback.play({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.thumbnail || '',
        url: fullPlayUrl,
        duration: track.duration || 0,
        index: currIdx >= 0 ? currIdx : 0,
        queue: activeList.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          artwork: t.thumbnail,
          url: t.streamUrl?.startsWith('http')
            ? t.streamUrl
            : `${backendBase}/api/stream?title=${encodeURIComponent(t.title)}&artist=${encodeURIComponent(t.artist)}`,
          duration: t.duration,
        })),
      }).catch(console.warn);

      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = playUrl;
        audioRef.current.playbackRate = speed;
        audioRef.current.play().catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleToggleOffline = async (track: Track) => {
    const isDownloaded = offlineTracks.some((t) => t.id === track.id);
    if (isDownloaded) {
      await deleteOfflineTrack(track.id);
      if (isNativeApp()) {
        MediaPlayback.removeCachedTrack({ id: track.id }).catch(console.warn);
      }
      setOfflineTracks((prev) => prev.filter((t) => t.id !== track.id));
      setOfflineAlert(`Трек «${track.title}» удалён из кеша.`);
      setTimeout(() => setOfflineAlert(null), 3000);
    } else {
      setDownloadingIds((prev) => new Set(prev).add(track.id));
      setOfflineAlert(`Кеширование «${track.title}» в память приложения...`);
      try {
        await saveTrackOffline(track);
        if (isNativeApp()) {
          const backendBase = 'https://sonor-music-ubvp.onrender.com';
          const fullStreamUrl = track.streamUrl?.startsWith('http')
            ? track.streamUrl
            : `${backendBase}/api/stream?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
          MediaPlayback.cacheTrack({ id: track.id, url: fullStreamUrl }).catch(console.warn);
        }
        const updated = await getAllOfflineTracks();
        setOfflineTracks(updated);
        setOfflineAlert(`✓ Трек «${track.title}» закеширован! Доступен без интернета.`);
        setTimeout(() => setOfflineAlert(null), 4000);
      } catch (err: any) {
        console.error('Caching error:', err);
        setOfflineAlert(`Ошибка кеширования: ${err?.message || 'проверьте подключение'}`);
        setTimeout(() => setOfflineAlert(null), 4000);
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    }
  };

  const handleClearAllOffline = async () => {
    if (confirm('Удалить все скачанные треки из памяти телефона?')) {
      await clearAllOfflineTracks();
      setOfflineTracks([]);
      setOfflineAlert('Офлайн-хранилище очищено.');
      setTimeout(() => setOfflineAlert(null), 3000);
    }
  };

  const handleClearRecent = () => {
    setRecentTracks([]);
    try {
      localStorage.removeItem(recentKey);
    } catch {}
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 18) return 'Добрый день';
    if (h >= 18 && h < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  const handleSelectMix = async (mix: PersonalMix) => {
    setActiveMood(null);
    setActiveHomeCategoryTitle(`Микс: ${mix.subtitle}`);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(mix.searchQuery)}`).then((r) => r.json());
      if (res.tracks && res.tracks.length > 0) {
        setHomeTracks(res.tracks);
        handlePlayTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMood = async (mood: MoodCategory) => {
    setActiveMood(mood.id);
    setActiveHomeCategoryTitle(`Настроение: ${mood.name}`);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(mood.query)}`).then((r) => r.json());
      if (res.tracks && res.tracks.length > 0) {
        setHomeTracks(res.tracks);
        handlePlayTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectArtist = async (artist: PopularArtist) => {
    setActiveMood(null);
    setActiveHomeCategoryTitle(`Исполнитель: ${artist.name}`);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(artist.query)}`).then((r) => r.json());
      if (res.tracks && res.tracks.length > 0) {
        setHomeTracks(res.tracks);
        handlePlayTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlbum = async (album: PopularAlbum) => {
    setActiveMood(null);
    setActiveHomeCategoryTitle(`Альбом: ${album.title}`);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(album.query)}`).then((r) => r.json());
      if (res.tracks && res.tracks.length > 0) {
        setHomeTracks(res.tracks);
        handlePlayTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    if (isNativeApp()) {
      MediaPlayback.setShuffle({ shuffle: nextShuffle }).catch(console.warn);
    }
  };

  const handleToggleRepeat = () => {
    const nextRepeat: 'off' | 'all' | 'one' = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(nextRepeat);
    if (isNativeApp()) {
      MediaPlayback.setRepeat({ mode: nextRepeat }).catch(console.warn);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    if (isNativeApp()) {
      if (isPlaying) {
        MediaPlayback.pause().catch(console.warn);
        setIsPlaying(false);
      } else {
        MediaPlayback.resume().catch(console.warn);
        setIsPlaying(true);
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (isNativeApp()) {
      MediaPlayback.next().catch(console.warn);
      return;
    }

    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
      return;
    }

    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => {
        const up = prev.slice(1);
        localStorage.setItem(queueKey, JSON.stringify(up));
        return up;
      });
      handlePlayTrack(next);
      return;
    }

    const activeList =
      currentTab === 'library'
        ? (activePlaylist ? activePlaylist.tracks : favorites)
        : currentTab === 'search'
        ? searchTracks
        : homeTracks;

    if (activeList.length > 0) {
      if (isShuffle) {
        const randIdx = Math.floor(Math.random() * activeList.length);
        handlePlayTrack(activeList[randIdx]);
      } else if (currentTrack) {
        const curr = activeList.findIndex((t) => t.id === currentTrack.id);
        const next = (curr + 1) % activeList.length;
        handlePlayTrack(activeList[next]);
      } else {
        handlePlayTrack(activeList[0]);
      }
    }
  };

  const handlePrev = () => {
    if (isNativeApp()) {
      MediaPlayback.prev().catch(console.warn);
      return;
    }

    const activeList =
      currentTab === 'library'
        ? (activePlaylist ? activePlaylist.tracks : favorites)
        : currentTab === 'search'
        ? searchTracks
        : homeTracks;

    if (activeList.length > 0 && currentTrack) {
      const curr = activeList.findIndex((t) => t.id === currentTrack.id);
      const prev = (curr - 1 + activeList.length) % activeList.length;
      handlePlayTrack(activeList[prev]);
    }
  };

  const handlePlayAll = (tracks: Track[], shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    const listToPlay = [...tracks];
    if (shuffle) {
      listToPlay.sort(() => Math.random() - 0.5);
    }
    handlePlayTrack(listToPlay[0]);
    const remaining = listToPlay.slice(1);
    setQueue(remaining);
    localStorage.setItem(queueKey, JSON.stringify(remaining));
  };

  return (
    <ClickSpark sparkColor={themeColor} sparkCount={7} sparkRadius={22} duration={360}>
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden relative scroll-smooth">
        <audio
          ref={audioRef}
          preload="auto"
          crossOrigin="anonymous"
          onError={(e) => {
            console.warn('Audio element error event:', e);
            if (currentTrack && audioRef.current) {
              const fallbackUrl = `/api/stream?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;
              if (audioRef.current.src && !audioRef.current.src.includes('/api/stream?')) {
                console.log('Falling back to universal stream:', fallbackUrl);
                audioRef.current.src = fallbackUrl;
                audioRef.current.play().catch(() => setIsPlaying(false));
                return;
              }
            }
            setIsPlaying(false);
          }}
        />

        {/* Background WebGL Scanner Effect */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-45 overflow-hidden">
          <Scanner
            color1="#0e0e12"
            color2={themeColor}
            color3="#ffffff"
            speed={0.4}
            sweepSpeed={0.22}
            sweepWidth={1.8}
            sweepFalloff={5.5}
            scale={1.6}
            frequency={2}
            ripple={0.2}
            bandDensity={11}
            lineSharpness={5.5}
            glow={0.25}
            scanDirection="vertical"
            colorSpread={0.5}
            brightness={0.85}
            contrast={1.2}
            softness={1.4}
            vignette={0.65}
            scanline={true}
            grain={true}
            grainIntensity={0.04}
            opacity={0.7}
            mouseInteraction={true}
            mouseRadius={0.5}
            mouseStrength={0.5}
          />
        </div>

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 py-2.5 sm:py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold transition-all duration-300 shadow-sm"
              style={{
                boxShadow: `0 0 16px var(--accent-glow, rgba(255,255,255,0.3))`,
              }}
            >
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <ShinyText
                text="SONOR"
                className="font-bold tracking-tight text-lg"
                speed={3.5}
              />
            </div>
          </div>

          {/* Right Header Toolbar: Install App, Theme Button & User Account Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {canInstall && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition active:scale-95 animate-fadeIn shadow-sm"
                title="Установить мобильное приложение"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Установить</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsThemeOpen(true)}
              className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 transition active:scale-95 shadow-sm"
              title="Настройка цвета интерфейса"
            >
              <div
                className="w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-110 shadow-sm"
                style={{
                  backgroundColor: themeColor,
                  boxShadow: `0 0 8px ${themeColor}`,
                }}
              />
              <Palette className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition" />
              <span className="text-xs font-medium text-zinc-300 group-hover:text-white hidden sm:inline">
                Тема
              </span>
            </button>

            <UserMenu
              onOpenThemeModal={() => setIsThemeOpen(true)}
              onNavigateToPlaylists={() => {
                switchTab('library');
                setLibraryTab('playlists');
                setActivePlaylist(null);
              }}
              onNavigateToFavorites={() => {
                switchTab('library');
                setLibraryTab('favorites');
                setActivePlaylist(null);
              }}
            />
          </div>
        </header>

        {/* Animated Content Area */}
        <main className={`relative z-10 flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 ${
          currentTrack ? 'pb-44 sm:pb-36' : 'pb-28 sm:pb-24'
        }`}>
          {/* TAB 1: HOME */}
          {currentTab === 'home' && (
            <div key="tab-home" className="space-y-7 tab-content-active">
              {/* 0. Personal Greeting Header */}
              <div className="flex items-center justify-between pt-1 px-1">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>{getGreeting()}{user?.username ? `, ${user.username}` : ''}</span>
                    <span className="text-base sm:text-lg">✨</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Твой персональный музыкальный стрим
                  </p>
                </div>
              </div>

              {/* 1. Недавно прослушанные треки */}
              <HomeRecentlyPlayed
                recentTracks={recentTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={handlePlayTrack}
                onClearRecent={handleClearRecent}
              />

              {/* 2. Персональные миксы пользователя */}
              <HomePersonalMixes onSelectMix={handleSelectMix} />

              {/* 3. Подборки по настроению и жанрам */}
              <HomeMoodGrid
                activeMood={activeMood}
                onSelectMood={handleSelectMood}
              />

              {/* 4. Популярные альбомы и исполнители */}
              <HomePopularArtists
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
              />

              {/* 5. Персональные рекомендации */}
              <section className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {activeHomeCategoryTitle}
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">
                    {selectedGenre}
                  </span>
                </div>

                {/* JellyRadio Genres Component */}
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="overflow-x-auto py-2 scrollbar-none flex items-center pr-6">
                    <JellyRadio
                      items={GENRES}
                      value={selectedGenre}
                      onChange={(genre) => {
                        setActiveMood(null);
                        setActiveHomeCategoryTitle(`Рекомендации: ${genre}`);
                        handleGenreChange(genre);
                      }}
                      chipColor="#18181b"
                      activeColor="#ffffff"
                      textColor="#a1a1aa"
                      activeTextColor="#09090b"
                      size="md"
                      gap={8}
                      radius={18}
                      swell={0.25}
                      barge={8}
                      shrink={0.06}
                      jelly={1.3}
                      bounce={0.35}
                      stagger={20}
                      stiffness={480}
                    />
                  </div>
                  <GradualBlur
                    target="parent"
                    position="right"
                    width="2.5rem"
                    strength={1.8}
                    divCount={4}
                    curve="ease-out"
                    opacity={0.85}
                    zIndex={10}
                  />
                </div>

                {/* Home Tracks List */}
                {isLoading && homeTracks.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Загружаем треки...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {homeTracks.map((track, idx) => (
                      <TrackCard
                        key={`home-${track.id}-${idx}`}
                        track={track}
                        index={idx}
                        isPlaying={isPlaying}
                        isCurrent={currentTrack?.id === track.id}
                        isLiked={favorites.some((f) => f.id === track.id)}
                        isOffline={offlineTracks.some((t) => t.id === track.id)}
                        isDownloading={downloadingIds.has(track.id)}
                        onPlay={handlePlayTrack}
                        onToggleLike={toggleFavorite}
                        onToggleOffline={handleToggleOffline}
                        onAddToQueue={addToQueue}
                        onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                      />
                    ))}
                  </div>
                )}

                {homeTracks.length > 0 && (
                  <div className="py-6 flex justify-center">
                    <ScrollReveal
                      baseOpacity={0.1}
                      enableBlur={true}
                      baseRotation={1.5}
                      blurStrength={5}
                      containerClassName="text-center my-2"
                      textClassName="text-xs sm:text-sm font-normal text-zinc-400"
                    >
                      Конец подборки • Выберите жанр или микс выше
                    </ScrollReveal>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {currentTab === 'search' && (
            <div key="tab-search" className="space-y-4 tab-content-active">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Поиск по трекам, артистам..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="px-4 sm:px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 active:scale-95 flex-shrink-0"
                >
                  Найти
                </button>
              </div>

              {/* Source Switcher using JellyRadio */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/5 overflow-x-auto scrollbar-none">
                <span className="text-zinc-500 text-xs font-medium flex-shrink-0">Источник:</span>
                <JellyRadio
                  items={[
                    { value: 'all', label: 'Все' },
                    {
                      value: 'spotify',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <ServiceLogo source="spotify" className="w-3.5 h-3.5" />
                          <span>Spotify</span>
                        </span>
                      ),
                    },
                    {
                      value: 'soundcloud',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <ServiceLogo source="soundcloud" className="w-3.5 h-3.5" />
                          <span>SoundCloud</span>
                        </span>
                      ),
                    },
                    {
                      value: 'youtube',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <ServiceLogo source="youtube" className="w-3.5 h-3.5" />
                          <span>YouTube Music</span>
                        </span>
                      ),
                    },
                  ]}
                  value={sourceFilter}
                  onChange={(val) => setSourceFilter(val as any)}
                  chipColor="#18181b"
                  activeColor="#ffffff"
                  textColor="#a1a1aa"
                  activeTextColor="#09090b"
                  size="sm"
                  gap={6}
                  radius={16}
                  swell={0.2}
                  barge={5}
                  shrink={0.05}
                  jelly={1}
                  bounce={0.25}
                  stagger={22}
                  stiffness={580}
                />
              </div>

              {/* Search Results */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Ищем треки...</span>
                </div>
              ) : searchTracks.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-sm">
                  Введите запрос, чтобы найти музыку
                </div>
              ) : (
                <div className="space-y-1">
                  {searchTracks.map((track, idx) => (
                    <TrackCard
                      key={`search-${track.id}-${idx}`}
                      track={track}
                      index={idx}
                      isPlaying={isPlaying}
                      isCurrent={currentTrack?.id === track.id}
                      isLiked={favorites.some((f) => f.id === track.id)}
                      isOffline={offlineTracks.some((t) => t.id === track.id)}
                      isDownloading={downloadingIds.has(track.id)}
                      onPlay={handlePlayTrack}
                      onToggleLike={toggleFavorite}
                      onToggleOffline={handleToggleOffline}
                      onAddToQueue={addToQueue}
                      onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIBRARY */}
          {currentTab === 'library' && (
            <div key="tab-library" className="space-y-4 tab-content-active">
              {/* When a playlist is opened, render PlaylistView */}
              {activePlaylist ? (
                <PlaylistView
                  playlist={activePlaylist}
                  onBack={() => setActivePlaylist(null)}
                  onPlayTrack={handlePlayTrack}
                  onPlayAll={handlePlayAll}
                  onRemoveTrack={removeTrackFromPlaylist}
                  onDeletePlaylist={deletePlaylist}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onAddToQueue={addToQueue}
                  onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                  offlineTrackIds={new Set(offlineTracks.map((t) => t.id))}
                  downloadingTrackIds={downloadingIds}
                  onToggleOffline={handleToggleOffline}
                />
              ) : (
                <>
                  {/* Library Navigation: Playlists, Favorites, Downloads, Queue */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                    <div className="w-full sm:w-auto overflow-x-auto scrollbar-none touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
                      <div className="flex items-center gap-2 min-w-max py-1">
                        {[
                          { id: 'playlists', label: `Плейлисты (${playlists.length})` },
                          { id: 'favorites', label: `Понравившиеся (${favorites.length})` },
                          { id: 'downloads', label: `Офлайн (${offlineTracks.length})` },
                          { id: 'queue', label: `Очередь (${queue.length})` },
                        ].map((tab) => {
                          const isActive = libraryTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setLibraryTab(tab.id as any)}
                              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 select-none active:scale-95 flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-white text-black font-semibold shadow-md shadow-white/10'
                                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10'
                              }`}
                            >
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {libraryTab === 'playlists' && (
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Создать плейлист</span>
                        </button>
                      )}

                      {libraryTab === 'downloads' && offlineTracks.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllOffline}
                          className="text-xs text-red-400 hover:text-red-300 transition px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 active:scale-95"
                          title="Удалить все скачанные треки"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Очистить офлайн</span>
                        </button>
                      )}

                      {libraryTab === 'queue' && queue.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQueue([]);
                            localStorage.removeItem(queueKey);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 transition px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Очистить очередь</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. PLAYLISTS SECTION */}
                  {libraryTab === 'playlists' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                        {/* Create Playlist Action Tile */}
                        <div
                          onClick={() => setIsCreateModalOpen(true)}
                          className="group aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900/60 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold mb-2.5 group-hover:scale-110 transition-transform shadow-md">
                            <Plus className="w-6 h-6 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            Новый плейлист
                          </span>
                          <span className="text-[11px] text-zinc-500 mt-0.5">
                            Собрать треки
                          </span>
                        </div>

                        {/* Existing Playlists Grid */}
                        {playlists.map((pl) => (
                          <div
                            key={pl.id}
                            onClick={() => setActivePlaylist(pl)}
                            className="group relative rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/10 hover:border-white/20 p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-md overflow-hidden"
                          >
                            {/* Artwork Box */}
                            <div
                              className="w-full aspect-square rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner"
                              style={{ backgroundColor: pl.coverColor || '#6366f1' }}
                            >
                              <Music className="w-10 h-10 text-black/75 stroke-[2]" />
                              
                              {/* Hover Play Button (Spotify style) */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAll(pl.tracks, false);
                                }}
                                className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 hover:scale-110 active:scale-90"
                                title="Слушать плейлист"
                              >
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                              </div>
                            </div>

                            <div className="pt-2.5 truncate">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-zinc-100">
                                {pl.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {pl.tracks.length} треков
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. FAVORITES SECTION */}
                  {libraryTab === 'favorites' && (
                    favorites.length === 0 ? (
                      <div className="text-center py-24 text-zinc-500 text-sm">
                        В медиатеке пока пусто. Добавляйте понравившиеся треки сердечком.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {favorites.map((track, idx) => (
                          <TrackCard
                            key={`fav-${track.id}-${idx}`}
                            track={track}
                            index={idx}
                            isPlaying={isPlaying}
                            isCurrent={currentTrack?.id === track.id}
                            isLiked={true}
                            isOffline={offlineTracks.some((t) => t.id === track.id)}
                            isDownloading={downloadingIds.has(track.id)}
                            onPlay={handlePlayTrack}
                            onToggleLike={toggleFavorite}
                            onToggleOffline={handleToggleOffline}
                            onAddToQueue={addToQueue}
                            onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* 3. DOWNLOADS / OFFLINE SECTION */}
                  {libraryTab === 'downloads' && (
                    offlineTracks.length === 0 ? (
                      <div className="text-center py-20 px-4 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 mx-auto flex items-center justify-center text-zinc-500 shadow-inner">
                          <HardDriveDownload className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-white">Офлайн-хранилище пусто</h3>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                          Нажмите на иконку скачивания рядом с любым треком или в плеере, чтобы сохранить его на телефон для прослушивания без интернета.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div className="text-xs text-zinc-400">
                            Доступно без интернета: <span className="text-white font-medium">{offlineTracks.length} треков</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (offlineTracks.length > 0) {
                                handlePlayTrack(offlineTracks[0]);
                                setQueue(offlineTracks.slice(1));
                              }
                            }}
                            className="text-xs font-semibold text-black bg-white hover:bg-zinc-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 shadow-md"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Включить всё</span>
                          </button>
                        </div>
                        <div className="space-y-1">
                          {offlineTracks.map((track, idx) => (
                            <TrackCard
                              key={`offline-${track.id}-${idx}`}
                              track={track}
                              index={idx}
                              isPlaying={isPlaying}
                              isCurrent={currentTrack?.id === track.id}
                              isLiked={favorites.some((f) => f.id === track.id)}
                              isOffline={true}
                              isDownloading={downloadingIds.has(track.id)}
                              onPlay={handlePlayTrack}
                              onToggleLike={toggleFavorite}
                              onToggleOffline={handleToggleOffline}
                              onAddToQueue={addToQueue}
                              onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* 4. QUEUE SECTION */}
                  {libraryTab === 'queue' && (
                    queue.length === 0 ? (
                      <div className="text-center py-24 text-zinc-500 text-sm">
                        Очередь воспроизведения пуста.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {queue.map((track, idx) => (
                          <TrackCard
                            key={`queue-${track.id}-${idx}`}
                            track={track}
                            index={idx}
                            isPlaying={isPlaying}
                            isCurrent={currentTrack?.id === track.id}
                            isLiked={favorites.some((f) => f.id === track.id)}
                            isOffline={offlineTracks.some((t) => t.id === track.id)}
                            isDownloading={downloadingIds.has(track.id)}
                            onPlay={handlePlayTrack}
                            onToggleLike={toggleFavorite}
                            onToggleOffline={handleToggleOffline}
                            onAddToQueue={addToQueue}
                            onAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                          />
                        ))}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Queue Drawer */}
        {isQueueOpen && (
          <aside className="fixed right-0 top-0 bottom-24 w-80 bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 p-4 z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-sm font-semibold text-white">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-zinc-400" />
                <span>Очередь ({queue.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueOpen(false)}
                className="p-1 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto py-2 space-y-1 pr-1 pb-6">
                {queue.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-10">Очередь пуста</p>
                ) : (
                  queue.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 group text-xs"
                    >
                      <div
                        onClick={() => handlePlayTrack(t)}
                        className="truncate flex-1 cursor-pointer pr-2"
                      >
                        <div className="text-white truncate font-medium">{t.title}</div>
                        <div className="text-zinc-500 truncate">{t.artist}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromQueue(t.id)}
                        className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <GradualBlur
                target="parent"
                position="bottom"
                height="3rem"
                strength={2}
                divCount={5}
                curve="bezier"
                opacity={0.9}
                zIndex={10}
              />
            </div>
          </aside>
        )}

        {/* Gradual Blur overlays for smooth page scrolling and track fade */}
        <GradualBlur
          target="page"
          position="bottom"
          height="8.5rem"
          strength={3}
          divCount={7}
          curve="bezier"
          exponential={true}
          opacity={1}
          zIndex={30}
        />
        <GradualBlur
          target="page"
          position="top"
          height="4.5rem"
          strength={1.8}
          divCount={5}
          curve="bezier"
          opacity={0.85}
          zIndex={20}
        />

        {/* Offline notification banners */}
        {!isOnline && (
          <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto bg-amber-500/20 border border-amber-500/40 backdrop-blur-xl rounded-2xl p-2.5 px-4 flex items-center justify-between text-amber-200 text-xs shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Офлайн-режим • Доступны скачанные треки</span>
            </div>
            <button
              type="button"
              onClick={() => {
                switchTab('library');
                setLibraryTab('downloads');
              }}
              className="text-[11px] font-semibold bg-amber-400 text-black px-2.5 py-1 rounded-full hover:bg-amber-300 transition active:scale-95 flex-shrink-0"
            >
              Открыть
            </button>
          </div>
        )}

        {offlineAlert && (
          <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto bg-zinc-900/95 border border-white/20 backdrop-blur-xl rounded-2xl p-3 px-4 text-white text-xs shadow-2xl flex items-center justify-between gap-2 animate-fadeIn">
            <span>{offlineAlert}</span>
            <button
              type="button"
              onClick={() => setOfflineAlert(null)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SPOTIFY PLAYER (Floating Mini Player + Fullscreen Spotify Modal) */}
        <SpotifyPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          audioRef={audioRef}
          currentTime={currentTime}
          duration={duration}
          onSeek={(time) => {
            if (isNativeApp()) {
              MediaPlayback.seekTo({ position: time }).catch(console.warn);
              setCurrentTime(time);
            } else if (audioRef.current) {
              audioRef.current.currentTime = time;
              setCurrentTime(time);
            }
          }}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          speed={speed}
          onSpeedChange={handleSpeedChange}
          isLiked={favorites.some((f) => f.id === currentTrack?.id)}
          onToggleLike={toggleFavorite}
          isOffline={Boolean(currentTrack && offlineTracks.some((t) => t.id === currentTrack.id))}
          isDownloading={Boolean(currentTrack && downloadingIds.has(currentTrack.id))}
          onToggleOffline={handleToggleOffline}
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          isQueueOpen={isQueueOpen}
          onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onToggleRepeat={handleToggleRepeat}
          isExpanded={isPlayerExpanded}
          onExpandedChange={setIsPlayerExpanded}
        />

        {/* Floating Glass Pill Navigation Bar (completely hidden when player is fullscreen) */}
        {!isPlayerExpanded && (
          <BottomNav
            currentTab={currentTab}
            onTabChange={switchTab}
            isVisible={!isPlayerExpanded}
          />
        )}

        {/* Theme Customization Modal */}
        <ThemeModal
          isOpen={isThemeOpen}
          onClose={() => setIsThemeOpen(false)}
          currentColor={themeColor}
          onSelectColor={applyTheme}
        />

        {/* User Account Auth Modal */}
        <AuthModal />

        {/* Create Playlist Modal */}
        <CreatePlaylistModal />

        {/* Add To Playlist Modal */}
        <AddToPlaylistModal />
      </div>
    </ClickSpark>
  );
}

'use client';

import React from 'react';
import { Users, Disc, Play } from 'lucide-react';

export interface PopularArtist {
  id: string;
  name: string;
  genre: string;
  image: string;
  query: string;
}

export interface PopularAlbum {
  id: string;
  title: string;
  artist: string;
  year: string;
  image: string;
  query: string;
}

export const POPULAR_ARTISTS: PopularArtist[] = [
  {
    id: 'art-atsuover',
    name: 'Atsuover',
    genre: 'FNF OST & Indie',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e9/bc/3b/e9bc3bec-42b8-9e43-76e5-8fc107b3bcd3/artwork.jpg/600x600bb.jpg',
    query: 'Atsuover FNF Smoke Em Out Struggle Nerves',
  },
  {
    id: 'art-kordhell',
    name: 'Kordhell',
    genre: 'Drift Phonk',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/84/55/be/8455bec4-e714-7a9a-9f6c-b0837b6f57d9/mza_14110788518648817659.jpeg/600x600bb.jpg',
    query: 'Kordhell Murder In My Mind Phonk',
  },
  {
    id: 'art-dvrst',
    name: 'DVRST',
    genre: 'Phonk & Electronic',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/91/37/55/913755a4-6c36-f306-64e9-0a83bb552adb/mza_7454153848988605786.png/600x600bb.jpg',
    query: 'DVRST Close Eyes Komarovo Phonk',
  },
  {
    id: 'art-weeknd',
    name: 'The Weeknd',
    genre: 'Synth-Pop & R&B',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Video211/v4/03/dc/59/03dc59ca-c486-8013-f23d-6d6ab67ddbe4/HurryUpTomorrow_iTunesStore_2000x3000_LSR.lsr/600x600bb.jpg',
    query: 'The Weeknd Blinding Lights Starboy',
  },
  {
    id: 'art-kamex',
    name: 'Kamex',
    genre: 'VGM & Remixes',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/ac/a1/41/aca14107-d3d0-f072-903a-71b6c113f497/mza_7247947800200276555.jpg/600x600bb.jpg',
    query: 'Kamex Remix VGM Video Game Music',
  },
  {
    id: 'art-daftpunk',
    name: 'Daft Punk',
    genre: 'French House & Electro',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ab/80/fa/ab80fafd-b22e-35ed-0d9b-73f72947a9b5/9781399600101.jpg/600x600bb.jpg',
    query: 'Daft Punk Get Lucky Around The World',
  },
];

export const POPULAR_ALBUMS: PopularAlbum[] = [
  {
    id: 'alb-smoke-em',
    title: "Smoke 'Em Out Struggle",
    artist: 'Atsuover & Rageminer',
    year: '2021 • OST',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e9/bc/3b/e9bc3bec-42b8-9e43-76e5-8fc107b3bcd3/artwork.jpg/600x600bb.jpg',
    query: 'Smoke Em Out Struggle Atsuover Hazy River',
  },
  {
    id: 'alb-close-eyes',
    title: 'Close Eyes',
    artist: 'DVRST',
    year: '2021 • Single',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a4/09/b3/a409b30c-7b00-3023-3dbd-0275be6506f3/196292358872.jpg/600x600bb.jpg',
    query: 'DVRST Close Eyes',
  },
  {
    id: 'alb-after-hours',
    title: 'After Hours',
    artist: 'The Weeknd',
    year: '2020 • Album',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/d1/2b/44d12b07-0639-65b3-3466-96a8be2c75a7/20UMGIM08600.rgb.jpg/600x600bb.jpg',
    query: 'The Weeknd After Hours Album',
  },
  {
    id: 'alb-discovery',
    title: 'Discovery',
    artist: 'Daft Punk',
    year: '2001 • Album',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c3/8c/99/c38c99f1-325b-aeec-4a7b-e1aa49f6f69c/0724384960650.jpg/600x600bb.jpg',
    query: 'Daft Punk Discovery One More Time',
  },
];

interface HomePopularArtistsProps {
  onSelectArtist: (artist: PopularArtist) => void;
  onSelectAlbum: (album: PopularAlbum) => void;
}

export const HomePopularArtists: React.FC<HomePopularArtistsProps> = ({
  onSelectArtist,
  onSelectAlbum,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Популярные исполнители (Круглые аватарки) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Популярные исполнители
            </h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist(artist)}
              className="group flex-shrink-0 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all duration-200 w-24 sm:w-28 snap-start"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 group-hover:border-emerald-400/80 shadow-md group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Floating Play Icon on Hover/Tap */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2 w-full px-1">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {artist.name}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">Исполнитель</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Популярные альбомы и релизы */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Популярные альбомы и релизы
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {POPULAR_ALBUMS.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
              className="group bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 rounded-2xl p-2.5 sm:p-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 shadow-md mb-2.5">
                <img
                  src={album.image}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </div>
              </div>

              <div className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                {album.title}
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                {album.artist}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {album.year}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

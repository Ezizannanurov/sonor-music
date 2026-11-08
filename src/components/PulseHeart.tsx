'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './PulseHeart.css';

const FavouriteIcon: [string, Record<string, any>][] = [
  [
    'path',
    {
      d: 'M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z',
      key: 'k0'
    }
  ]
];

const StarIcon: [string, Record<string, any>][] = [
  [
    'path',
    {
      d: 'M13.7276 3.44418L15.4876 6.99418C15.7276 7.48418 16.3676 7.95418 16.9076 8.04418L20.0976 8.57418C22.1376 8.91418 22.6176 10.3942 21.1476 11.8542L18.6676 14.3342C18.2476 14.7542 18.0176 15.5642 18.1476 16.1442L18.8576 19.2342C19.4176 21.6842 18.1276 22.6242 15.9776 21.3442L13.0076 19.5742C12.4676 19.2542 11.5576 19.2542 11.0076 19.5742L8.03756 21.3442C5.89756 22.6242 4.59756 21.6742 5.15756 19.2342L5.86756 16.1442C5.99756 15.5642 5.76756 14.7542 5.34756 14.3342L2.86756 11.8542C1.40756 10.3942 1.88756 8.91418 3.91756 8.57418L7.10756 8.04418C7.63756 7.95418 8.27756 7.48418 8.51756 6.99418L10.2776 3.44418C11.2276 1.52418 12.7776 1.52418 13.7276 3.44418Z',
      key: 'k1'
    }
  ]
];

const ThumbsUpIcon: [string, Record<string, any>][] = [
  [
    'path',
    {
      d: 'M7 10V19M2 13V19C2 20.1046 2.89543 21 4 21H16.6348C18.1565 21 19.4448 19.8821 19.6888 18.3792L20.8252 11.3792C21.1118 9.61205 19.7423 8 17.9525 8H14C14 8 15 5 15 3.5C15 2 13.5 2 12.5 2C11.5 2 11 3 11 4.5C11 6 8.5 10 7 10H4C2.89543 10 2 10.8954 2 12V13Z',
      key: 'k2'
    }
  ]
];

const OUT = 0.4;
const ICONS: Record<string, any> = { heart: FavouriteIcon, star: StarIcon, thumb: ThumbsUpIcon };

const back = (k: number, c: number) => {
  const u = k - 1;
  return 1 + (c + 1) * u ** 3 + c * u ** 2;
};

const swellOf = (t: number, c: number) =>
  t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), c);

const format = (n: number) => new Intl.NumberFormat().format(n);

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface PulseHeartProps {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  onChange?: (liked: boolean, count: number) => void;
  showCount?: boolean;
  icon?: 'heart' | 'star' | 'thumb' | ReactNode;
  idleOutline?: boolean;
  size?: number;
  corner?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  duration?: number;
  dotSize?: number;
  overshoot?: number;
  beat?: number;
  rollDuration?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function PulseHeart({
  liked: likedProp,
  defaultLiked = false,
  count = 0,
  onChange,
  showCount = true,
  icon = 'heart',
  idleOutline = true,
  size = 40,
  corner = 32,
  likedColor = '#ff4d6d',
  idleColor = '#8b8b93',
  pillColor = '#232326',
  textColor = '#f5f5f5',
  duration = 560,
  dotSize = 0.3,
  overshoot = 1.7,
  beat = 3,
  rollDuration = 350,
  disabled = false,
  label = 'Like',
  className = ''
}: PulseHeartProps) {
  const controlled = likedProp !== undefined;
  const [inner, setInner] = useState(defaultLiked);
  const [total, setTotal] = useState(count);
  const liked = controlled ? likedProp : inner;
  const [shown, setShown] = useState({ liked, count });
  const [roll, setRoll] = useState<{ a: string; b: string; at: number; up: boolean } | null>(null);

  const rootRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const heartRef = useRef<HTMLSpanElement>(null);
  const glyphRef = useRef<SVGGElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const raf = useRef<number>(0);
  const rollTimer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const viaPointer = useRef(false);
  const shownRef = useRef(shown);
  const logical = useRef({ liked, count: total });
  logical.current = { liked, count: total };
  const cfg = useRef({ duration, dotSize, overshoot, beat, rollDuration });
  cfg.current = { duration, dotSize, overshoot, beat, rollDuration };

  useEffect(() => {
    setTotal(count);
  }, [count]);

  useEffect(() => {
    if (raf.current) return;
    if (shownRef.current.liked === liked && shownRef.current.count === total) return;
    shownRef.current = { liked, count: total };
    setShown(shownRef.current);
  }, [liked, total]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || root.dataset.instant === undefined) return;
    root.getBoundingClientRect();
    delete root.dataset.instant;
  }, [shown]);

  useLayoutEffect(() => {
    const el = rollRef.current;
    if (!el || !roll) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${roll.up ? '0' : '-1em'})`;
    el.getBoundingClientRect();
    el.style.transition = '';
    el.style.transform = `translateY(${roll.up ? '-1em' : '0'})`;
  }, [roll]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(rollTimer.current);
    },
    []
  );

  const startRoll = (from: number, to: number) => {
    if (from === to) return;
    const a = format(from);
    const b = format(to);
    const changed = a.length === b.length ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : [])) : [];
    setRoll({ a, b, at: changed.length === 1 ? changed[0] : -1, up: to > from });
    clearTimeout(rollTimer.current);
    rollTimer.current = setTimeout(() => setRoll(null), cfg.current.rollDuration);
  };

  const run = (nextLiked: boolean, nextCount: number) => {
    const root = rootRef.current;
    const heart = heartRef.current;
    const pill = pillRef.current;
    if (!root || !heart || !pill) return;
    const glyph = glyphRef.current;
    root.dataset.running = '';
    let swapped = false;
    let prev = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const { duration: D, dotSize: dot, overshoot: c, beat: B } = cfg.current;
      const t = Math.min(1, (now - t0) / D);
      const step = prev ? now - prev : 1000 / 60;
      prev = now;
      const s = swellOf(t, c);
      const k = 1 - (1 - dot) * s;
      if (glyph) glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`);
      else heart.style.transform = `scale(${k})`;
      pill.style.transform = `scale(${1 - (B / 100) * s})`;
      if (!swapped && t + step / 2 / D >= OUT) {
        swapped = true;
        root.dataset.liked = String(nextLiked);
        startRoll(shownRef.current.count, nextCount);
        shownRef.current = { liked: nextLiked, count: nextCount };
        setShown(shownRef.current);
      }
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      raf.current = 0;
      if (glyph) glyph.removeAttribute('transform');
      heart.style.transform = '';
      pill.style.transform = '';
      delete root.dataset.running;
      const l = logical.current;
      if (l.liked !== shownRef.current.liked || l.count !== shownRef.current.count) {
        shownRef.current = { liked: l.liked, count: l.count };
        setShown(shownRef.current);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || disabled) return;
    viaPointer.current = true;
    if (!reducedMotion() && rootRef.current) rootRef.current.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rootRef.current) delete rootRef.current.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer.current = false;
    handlePointerUp();
  };
  const handleKeyDown = () => {
    viaPointer.current = false;
  };
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled || raf.current) return;
    const pointer = viaPointer.current && e.detail !== 0;
    viaPointer.current = false;
    const nextLiked = !liked;
    const nextCount = total + (nextLiked ? 1 : -1);
    if (!controlled) setInner(nextLiked);
    setTotal(nextCount);
    onChange?.(nextLiked, nextCount);
    if (pointer && !reducedMotion()) run(nextLiked, nextCount);
    else if (rootRef.current) rootRef.current.dataset.instant = '';
  };

  const paths = typeof icon === 'string' ? ICONS[icon] || ICONS.heart : null;
  const text = format(shown.count);
  const cells = roll
    ? roll.at === -1
      ? [{ top: roll.up ? roll.a : roll.b, bottom: roll.up ? roll.b : roll.a }]
      : [...roll.b].map((ch, i) =>
          i === roll.at ? { top: roll.up ? roll.a[i] : ch, bottom: roll.up ? ch : roll.a[i] } : { ch }
        )
    : [...text].map(ch => ({ ch }));

  const dynamicStyle = {
    '--ph-size': `${size}px`,
    '--ph-corner': `${corner}px`,
    '--ph-pill': pillColor,
    '--ph-idle': idleColor,
    '--ph-liked': likedColor,
    '--ph-text': textColor,
    '--ph-roll': `${rollDuration}ms`,
    '--ph-stroke': `${(1.5 * size) / 24}px`
  } as CSSProperties;

  return (
    <button
      ref={rootRef}
      type="button"
      aria-pressed={liked}
      disabled={disabled}
      data-liked={String(shown.liked)}
      data-solid={idleOutline ? undefined : ''}
      data-no-count={showCount ? undefined : ''}
      className={`pulse-heart${className ? ` ${className}` : ''}`}
      style={dynamicStyle}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <span ref={pillRef} className="pulse-heart__pill">
        <span ref={heartRef} className="pulse-heart__heart" aria-hidden="true">
          {paths ? (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g ref={glyphRef}>
                {paths.map((item: any, idx: number) => {
                  const attrs = Array.isArray(item) ? item[1] : item;
                  return (
                    <path
                      key={String(attrs?.key || idx)}
                      d={String(attrs?.d || '')}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </g>
            </svg>
          ) : (
            icon
          )}
        </span>
        {showCount ? (
          <span className="pulse-heart__count" aria-hidden="true">
            {cells.map((cell: any, i) =>
              'ch' in cell ? (
                <span key={`c${i}`}>{cell.ch}</span>
              ) : (
                <span key={`r${i}`} className="pulse-heart__slot">
                  <span ref={rollRef} className="pulse-heart__roll">
                    <span>{cell.top}</span>
                    <span>{cell.bottom}</span>
                  </span>
                </span>
              )
            )}
          </span>
        ) : null}
        <span className="pulse-heart__sr">{showCount ? `${label}, ${format(total)}` : label}</span>
      </span>
    </button>
  );
}

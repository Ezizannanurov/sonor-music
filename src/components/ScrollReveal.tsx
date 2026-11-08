'use client';

import React, { useEffect, useRef, useMemo, useState, type ReactNode } from 'react';
import './ScrollReveal.css';

export interface ScrollRevealProps {
  children?: ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

export default function ScrollReveal({
  children,
  enableBlur = true,
  baseOpacity = 0.2,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    if (!text) return children;
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span
          className="word"
          key={index}
          style={{
            display: 'inline-block',
            transition: `opacity 0.6s ease ${index * 0.03}s, filter 0.6s ease ${index * 0.03}s, transform 0.6s ease ${index * 0.03}s`,
            opacity: isVisible ? 1 : baseOpacity,
            filter: isVisible ? 'blur(0px)' : enableBlur ? `blur(${blurStrength}px)` : 'none',
            transform: isVisible ? 'translateY(0px)' : 'translateY(4px)',
          }}
        >
          {word}
        </span>
      );
    });
  }, [children, isVisible, baseOpacity, enableBlur, blurStrength]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <div className={`scroll-reveal-text ${textClassName}`}>{splitText}</div>
    </div>
  );
}

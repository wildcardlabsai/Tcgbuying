/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({
  className = '',
  variant = 'dark',
  size = 'md',
  showText = true,
}: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';

  const sizeDimensions = {
    sm: { icon: 'h-6 w-7', text: 'text-lg', box: 'gap-2' },
    md: { icon: 'h-7 w-8', text: 'text-xl', box: 'gap-2.5' },
    lg: { icon: 'h-9 w-10', text: 'text-2xl', box: 'gap-3' },
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeDimensions.box} select-none ${className}`}>
      {/* Precision SVG matching the 3-slanted card icon from EE0A08D9-622A-42CB-AB23-B98D9A66F212 */}
      <svg
        className={`${sizeDimensions.icon} shrink-0 overflow-visible`}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Card 1 gradient: bright cyan to vibrant electric blue */}
          <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00b4d8" />
            <stop offset="50%" stopColor="#0077b6" />
            <stop offset="100%" stopColor="#3a0ca3" />
          </linearGradient>

          {/* Card 2 gradient: luminous azure blue to deep royal purple */}
          <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0096c7" />
            <stop offset="40%" stopColor="#0052cc" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>

          {/* Card 3 gradient: dark navy with glossy highlight */}
          <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b2361" />
            <stop offset="100%" stopColor="#040b24" />
          </linearGradient>

          {/* Glass sheen highlight on front card */}
          <linearGradient id="cardSheen" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#2563eb" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1st Card (leftmost, background) */}
        <rect
          x="12"
          y="32"
          width="36"
          height="62"
          rx="9"
          transform="rotate(-15 12 32) skewX(-4)"
          fill="url(#cardGrad1)"
        />

        {/* 2nd Card (middle, overlapping) */}
        <rect
          x="32"
          y="18"
          width="40"
          height="76"
          rx="10"
          transform="rotate(-13 32 18) skewX(-4)"
          fill="url(#cardGrad2)"
        />

        {/* 3rd Card (front right, main card) */}
        <g transform="rotate(-10 56 6) skewX(-4)">
          <rect
            x="56"
            y="6"
            width="46"
            height="86"
            rx="11"
            fill="url(#cardGrad3)"
          />
          {/* Card subtle inner highlight / glossy curve */}
          <path
            d="M 56 17 C 56 11 60 6 67 6 L 91 6 C 97 6 102 11 102 17 L 102 42 C 86 36 70 30 56 46 Z"
            fill="url(#cardSheen)"
          />
        </g>
      </svg>

      {showText && (
        <span
          className={`font-extrabold tracking-tight ${sizeDimensions.text} ${textColor} leading-none`}
          style={{ letterSpacing: '-0.035em' }}
        >
          <span>TCG</span>
          <span className="font-bold">Buyer</span>
        </span>
      )}
    </div>
  );
}

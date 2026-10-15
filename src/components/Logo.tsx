/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface LogoProps {
  className?: string;
  /** 'dark' = black wordmark for light backgrounds; 'light' = white wordmark for dark backgrounds. */
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  /** Show only the card icon. */
  showText?: boolean;
}

const HEIGHT = { sm: 'h-8', md: 'h-10', lg: 'h-12' } as const;

export default function Logo({ className = '', variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const src = !showText ? '/brand/logo-icon.webp' : variant === 'light' ? '/brand/logo-light.webp' : '/brand/logo.webp';
  return (
    <img
      src={src}
      alt="TCGBuyer"
      width={showText ? 1104 : 309}
      height={240}
      className={`${HEIGHT[size]} w-auto select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
}

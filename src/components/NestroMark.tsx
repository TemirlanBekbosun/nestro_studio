import { useState } from 'react';
import { Layers } from 'lucide-react';

export function NestroLogoMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="33"
        height="33"
        rx="9"
        fill="url(#nestroGlassBg)"
        stroke="#D1D5D5"
        strokeWidth="1.2"
      />
      <path
        d="M11.5 25V11L24.5 25V11"
        stroke="#171919"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="nestroGlassBg"
          x1="2"
          y1="2"
          x2="34"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E8EBEB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface GlassImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function GlassImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: GlassImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#FFFFFF] via-[#E8EBEB] to-[#D1D5D5]/50 text-[#777D7D] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="w-8 h-8 mb-2 text-[#252B29]/50" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#171919]/70 max-w-[220px] line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

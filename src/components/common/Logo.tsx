import React from 'react';
import { useStore } from '../../context/StoreContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', onClick }) => {
  let siteName = 'Kalkerdeal';
  try {
    const store = useStore();
    if (store?.siteName) {
      siteName = store.siteName;
    }
  } catch {
    /* Outside StoreProvider fallback */
    try {
      const saved = localStorage.getItem('muba_site_name');
      if (saved) siteName = saved;
    } catch { /* ignore */ }
  }

  const iconSizes = {
    sm: 'w-5 h-5 sm:w-6 sm:h-6',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-10 sm:h-10'
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-2xl',
    lg: 'text-2xl sm:text-3xl'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 cursor-pointer select-none group shrink-0 ${className}`}
    >
      {/* Handcrafted Cart Bag Icon matching reference */}
      <svg
        className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-105 shrink-0`}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 16V12C16 8.68629 18.6863 6 22 6C25.3137 6 28 8.68629 28 12V16"
          stroke="#FF2B74"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <rect
          x="7"
          y="14"
          width="30"
          height="24"
          rx="7"
          stroke="#FF2B74"
          strokeWidth="3.2"
          fill="none"
        />
        <path
          d="M17 21C17 23.7614 19.2386 26 22 26C24.7614 26 27 23.7614 27 21"
          stroke="#00A5A8"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>

      {/* Dynamic Site Name Wordmark */}
      <div className={`font-extrabold tracking-tight ${textSizes[size]} leading-none text-[#00A5A8] truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none`}>
        {siteName}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { NestroLogoMark } from './NestroMark.tsx';

interface HeaderProps {
  brandName: string;
  onDiscussClick: () => void;
}

const NAV_ITEMS = [
  { href: '#top', label: 'Главная' },
  { href: '#projects', label: 'Проекты' },
  { href: '#services', label: 'Услуги' },
  { href: '#about', label: 'О нас' },
  { href: '#contact', label: 'Контакты' },
];

export function Header({ brandName, onDiscussClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8EBEB]/90 bg-[#F7F8F8]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single-line brand lockup */}
        <motion.a
          href="#top"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#171919] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#252B29] rounded-md"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <NestroLogoMark className="w-7 h-7 shrink-0" />
          <span>{brandName || 'NESTRO'}</span>
        </motion.a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#777D7D]"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 py-1 transition-colors duration-150 hover:text-[#171919] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#252B29] rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary CTA action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDiscussClick}
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-[#252B29] px-5 py-2.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#171919] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252B29]"
          >
            Обсудить проект
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            className="inline-flex md:hidden items-center justify-center w-11 h-11 rounded-xl border border-[#D1D5D5] bg-white/80 text-[#171919] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E8EBEB] bg-white/95 backdrop-blur-xl px-4 py-4">
          <nav aria-label="Мобильное меню" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="flex items-center min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#171919] hover:bg-[#F7F8F8]"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onDiscussClick();
              }}
              className="mt-2 flex items-center justify-center min-h-[44px] w-full rounded-xl bg-[#252B29] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Обсудить проект
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

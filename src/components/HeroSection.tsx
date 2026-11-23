import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { formatKgs } from '../utils/studioLogic.ts';
import { GlassImage } from './NestroMark.tsx';

interface HeroSectionProps {
  pageRateKgs: number;
  projectsCount: number;
  onDiscussClick: () => void;
  onViewProjectsClick: () => void;
}

export function HeroSection({
  pageRateKgs,
  projectsCount,
  onDiscussClick,
  onViewProjectsClick,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const showcaseY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 28]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden pt-7 pb-12 sm:pt-12 sm:pb-20"
    >
      {/* Subtle White Glass ambient light spots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-white/90 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 right-0 h-[380px] w-[380px] rounded-full bg-[#E8EBEB]/80 blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left column: clear positioning & CTAs */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-white/90 bg-white/85 p-5 sm:p-8 lg:p-10 shadow-[0_20px_60px_-28px_rgba(23,25,25,0.18)]"
          >
            <div>
              <p className="text-[14px] sm:text-sm font-semibold tracking-wide text-[#777D7D]">
                Веб-студия NESTRO · Бишкек
              </p>

              <h1
                className="mt-4 font-display font-semibold tracking-tight text-[#171919] leading-[1.05]"
                style={{
                  fontSize: 'clamp(2.125rem, 5.5vw, 4.5rem)',
                  textWrap: 'balance',
                }}
              >
                Создаём сайты для развития вашего бизнеса
              </h1>

              <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.65] text-[#686E6D] max-w-[52ch]">
                Продуманный дизайн, удобные функции и современные цифровые решения.
              </p>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onViewProjectsClick}
                className="min-h-14 inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B29] px-6 py-4 text-[16px] font-semibold text-white transition-all duration-150 hover:bg-[#171919] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252B29]"
              >
                <span>Посмотреть проекты</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onDiscussClick}
                className="min-h-14 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D1D5D5] bg-white px-6 py-4 text-[16px] font-semibold text-[#171919] transition-all duration-150 hover:border-[#252B29]/40 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252B29]"
              >
                <span>Обсудить проект</span>
                <ArrowDownRight className="w-4 h-4 text-[#777D7D]" />
              </button>
            </div>
          </motion.div>

          {/* Right column: Frosted glass visual showcase */}
          <motion.div
            style={{ y: showcaseY }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex"
          >
            <div className="glass-surface-strong rounded-3xl p-3 sm:p-4 w-full flex flex-col">
              <div className="relative overflow-hidden rounded-2xl border border-[#E8EBEB] bg-[#F7F8F8] aspect-[16/10] lg:h-full">
                <GlassImage
                  src="/src/assets/images/nestro_hero_glass_showcase_1795371335595.jpg"
                  alt="Презентация сайтов студии NESTRO на ноутбуке и смартфоне в стеклянной композиции"
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#171919]/15 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-width 4-column summary strip below hero split */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-surface rounded-2xl px-6 py-5">
            <div className="font-mono-num text-xl font-semibold text-[#171919]">
              от {formatKgs(pageRateKgs)}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#777D7D]">
              За одну страницу — понятная оценка для лендинга и многостраничного сайта
            </p>
          </div>

          <div className="glass-surface rounded-2xl px-6 py-5">
            <div className="font-mono-num text-xl font-semibold text-[#171919]">
              24/7 CRM и мессенджеры
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#777D7D]">
              Мгновенная реакция на каждый запрос без потери клиентов и задержек
            </p>
          </div>

          <div className="glass-surface rounded-2xl px-6 py-5">
            <div className="font-mono-num text-xl font-semibold text-[#171919]">
              {projectsCount} запущенных кейсов
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#777D7D]">
              Одностраничные и многостраничные проекты с открытым доступом
            </p>
          </div>

          <div className="glass-surface rounded-2xl px-6 py-5">
            <div className="font-mono-num text-xl font-semibold text-[#171919]">
              От идеи до запуска
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#777D7D]">
              Прототип, дизайн, разработка, подключение домена и поддержка
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

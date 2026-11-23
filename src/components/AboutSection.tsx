import type { StudioProfile } from '../types/studio.ts';
import { GlassImage } from './NestroMark.tsx';

interface AboutSectionProps {
  studio: StudioProfile;
}

export function AboutSection({ studio }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Portrait in frosted glass composition */}
          <div className="lg:col-span-5 flex">
            <div className="glass-surface-strong rounded-3xl p-3 sm:p-4 w-full flex flex-col justify-between">
              <div className="overflow-hidden rounded-2xl border border-[#E8EBEB] bg-[#E8EBEB]/40 aspect-[3/4] lg:h-full">
                <GlassImage
                  src={studio.portraitUrl}
                  alt={`${studio.founderName} — ${studio.founderRole}`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="pt-4 px-2 pb-1 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-[#171919]">
                    {studio.founderName}
                  </div>
                  <div className="text-xs text-[#777D7D]">{studio.founderRole}</div>
                </div>
                <span className="text-xs font-medium text-[#777D7D]">
                  {studio.city}
                </span>
              </div>
            </div>
          </div>

          {/* Human story & approach */}
          <div className="lg:col-span-7 flex flex-col justify-between glass-surface rounded-3xl p-7 sm:p-10">
            <div>
              <p className="text-[14px] font-semibold text-[#777D7D]">
                О студии
              </p>
              <h2
                className="mt-3 font-display text-[30px] sm:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#171919]"
                style={{ textWrap: 'balance' }}
              >
                За проектом стоит личная ответственность
              </h2>

              <p className="mt-5 text-[18px] sm:text-[20px] font-medium leading-[1.55] text-[#171919]">
                {studio.aboutLead}
              </p>

              <div className="mt-5 space-y-4 text-sm sm:text-[15px] leading-relaxed text-[#777D7D]">
                {studio.aboutStory.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E8EBEB]">
              <h3 className="text-sm font-semibold text-[#171919]">
                Ценности, на которых строится сотрудничество
              </h3>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studio.aboutValues.map((value, idx) => (
                  <li
                    key={idx}
                    className="rounded-2xl border border-[#E8EBEB] bg-white/65 px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#171919]"
                  >
                    <span className="font-mono-num text-[#777D7D] mr-2">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

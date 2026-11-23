import { useMemo, useState } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { ProjectCase, ProjectCategory } from '../types/studio.ts';
import { isSafeHttpUrl } from '../utils/studioLogic.ts';
import { GlassImage } from './NestroMark.tsx';

interface PortfolioSectionProps {
  projects: ProjectCase[];
  onSelectProject: (project: ProjectCase) => void;
}

type FilterMode = 'all' | ProjectCategory;

export function PortfolioSection({
  projects,
  onSelectProject,
}: PortfolioSectionProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.category === filter);
  }, [projects, filter]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      single: projects.filter((p) => p.category === 'single-page').length,
      multi: projects.filter((p) => p.category === 'multi-page').length,
    }),
    [projects],
  );

  return (
    <section id="projects" className="scroll-mt-20 py-14 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[14px] font-semibold text-[#777D7D]">
              Наши работы
            </p>
            <h2
              className="mt-2 font-display text-[30px] sm:text-[42px] font-semibold tracking-tight leading-[1.12] text-[#171919]"
              style={{ textWrap: 'balance' }}
            >
              Реальные проекты для разных задач
            </h2>
            <p className="mt-3 text-[16px] sm:text-[18px] leading-[1.65] text-[#686E6D] max-w-[60ch]">
              Сайты, которые уже помогают бизнесу получать клиентов.
            </p>
          </div>

          {/* Interactive filter segmented control */}
          <div
            role="group"
            aria-label="Фильтр проектов по типу"
            className="grid grid-cols-2 sm:flex sm:inline-flex w-full sm:w-auto items-center gap-1 p-1.5 rounded-xl border border-[#E8EBEB] bg-white/75 backdrop-blur-md self-start max-w-full"
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`min-h-11 px-2 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-[15px] font-medium transition-colors text-center shrink-0 cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#252B29] text-white'
                  : 'text-[#777D7D] hover:text-[#171919]'
              }`}
            >
              Все работы ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilter('single-page')}
              className={`min-h-11 px-2 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-[15px] font-medium transition-colors text-center shrink-0 cursor-pointer ${
                filter === 'single-page'
                  ? 'bg-[#252B29] text-white'
                  : 'text-[#777D7D] hover:text-[#171919]'
              }`}
            >
              Одностраничные ({counts.single})
            </button>
            <button
              type="button"
              onClick={() => setFilter('multi-page')}
              className={`col-span-2 min-h-11 px-2 sm:col-span-1 sm:px-4 py-2.5 rounded-lg text-[13px] sm:text-[15px] font-medium transition-colors text-center shrink-0 cursor-pointer ${
                filter === 'multi-page'
                  ? 'bg-[#252B29] text-white'
                  : 'text-[#777D7D] hover:text-[#171919]'
              }`}
            >
              Многостраничные ({counts.multi})
            </button>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="mt-10 glass-surface rounded-3xl p-10 text-center text-sm text-[#777D7D]">
            В выбранной категории пока нет проектов.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 lg:gap-8">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="glass-surface glass-card-hover rounded-3xl p-3 sm:p-5 flex flex-col"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectProject(project)}
                    aria-label={`Открыть подробный кейс проекта ${project.title}`}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-[#E8EBEB] bg-[#F7F8F8] aspect-[16/11] sm:aspect-[4/3] cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252B29]"
                  >
                    <GlassImage
                      src={project.imageUrl}
                      alt={`Скриншот проекта ${project.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </button>

                  {/* Clean unboxed metadata (zero pills) */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-[#777D7D]">
                    <span>{project.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{project.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">{project.year}</span>
                  </div>

                  <h3 className="mt-2 font-display text-[21px] sm:text-[24px] font-semibold leading-[1.25] tracking-tight text-[#171919]">
                    {project.title}
                  </h3>

                  <p className="mt-2 text-[16px] leading-[1.55] text-[#686E6D]">
                    {project.shortDescription}
                  </p>

                </div>

                <div className="mt-5 pt-4 border-t border-[#E8EBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectProject(project)}
                    className="min-h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B29] px-5 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-[#171919] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Подробнее о кейсе</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {isSafeHttpUrl(project.liveUrl) && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 text-[15px] font-semibold text-[#171919] hover:text-[#777D7D] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Открыть сайт</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { ExternalLink, Laptop, Smartphone, X } from 'lucide-react';
import type { ProjectCase } from '../types/studio.ts';
import { isSafeHttpUrl } from '../utils/studioLogic.ts';
import { GlassImage } from './NestroMark.tsx';

interface ProjectCaseModalProps {
  project: ProjectCase | null;
  onClose: () => void;
  onDiscussSimilar: (project: ProjectCase) => void;
}

export function ProjectCaseModal({
  project,
  onClose,
  onDiscussSimilar,
}: ProjectCaseModalProps) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    setDeviceView('desktop');
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171919]/45 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] max-h-[92vh] overflow-y-auto glass-surface-strong rounded-3xl p-5 sm:p-8 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar inside modal */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E8EBEB]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#777D7D]">
              <span>{project.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Статус: {project.status}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{project.year}</span>
            </div>
            <h2
              id="case-modal-title"
              className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#171919]"
            >
              {project.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть подробный кейс"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#D1D5D5] bg-white text-[#171919] hover:bg-[#F7F8F8] shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Desktop & Mobile Demonstration */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-medium text-[#777D7D]">
              6. Демонстрация интерфейса на компьютере и телефоне
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#E8EBEB] bg-[#F7F8F8]">
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  deviceView === 'desktop'
                    ? 'bg-white text-[#171919] shadow-xs'
                    : 'text-[#777D7D] hover:text-[#171919]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Компьютер</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('mobile')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  deviceView === 'mobile'
                    ? 'bg-white text-[#171919] shadow-xs'
                    : 'text-[#777D7D] hover:text-[#171919]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Телефон</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8EBEB] bg-[#F7F8F8] p-4 sm:p-6 flex flex-col items-center">
            {deviceView === 'desktop' ? (
              <div className="w-full overflow-hidden rounded-xl border border-[#D1D5D5] bg-white shadow-sm aspect-[16/10]">
                <GlassImage
                  src={project.imageUrl}
                  alt={`Десктопная версия ${project.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full max-w-[300px] overflow-hidden rounded-[28px] border-[5px] border-[#252B29] bg-white shadow-md aspect-[9/16]">
                <GlassImage
                  src={project.imageUrl}
                  alt={`Мобильная версия ${project.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="mt-4 text-xs sm:text-sm text-[#777D7D] text-center max-w-[65ch]">
              {deviceView === 'desktop'
                ? project.caseStudy.desktopNotes
                : project.caseStudy.mobileNotes}
            </p>
          </div>
        </div>

        {/* Structured 8-part case breakdown */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-5">
            <h3 className="text-sm font-semibold text-[#171919]">
              1. Описание задачи
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
              {project.caseStudy.taskDescription}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-5">
            <h3 className="text-sm font-semibold text-[#171919]">
              2. Проблема и потребность клиента
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
              {project.caseStudy.clientProblem}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-[#171919]">
              3. Предложенное решение
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
              {project.caseStudy.proposedSolution}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-5">
            <h3 className="text-sm font-semibold text-[#171919]">
              4. Этапы реализации
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-[#777D7D]">
              {project.caseStudy.implementationStages.map((stage, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-num text-xs text-[#171919] mt-0.5">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{stage}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-5">
            <h3 className="text-sm font-semibold text-[#171919]">
              5. Основные функции
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[#777D7D]">
              {project.caseStudy.keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#171919] mt-0.5">—</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 7. Result + Tech */}
        <div className="mt-6 rounded-2xl border border-[#E8EBEB] bg-white/80 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-[#171919]">
            7. Результат проекта
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#171919]">
            {project.caseStudy.result}
          </p>
          <p className="mt-3 text-xs text-[#777D7D]">
            Использованный стек: {project.technologies.join(' · ')}
          </p>
        </div>

        {/* 8. Footer actions & Live Link */}
        <div className="mt-6 pt-5 border-t border-[#E8EBEB] flex flex-wrap items-center justify-between gap-3">
          {isSafeHttpUrl(project.liveUrl) ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D1D5D5] bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-[#171919] hover:bg-[#F7F8F8] transition-colors"
            >
              <span>8. Перейти на работающий сайт</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-xs text-[#777D7D]">
              8. Проект в статусе: {project.status}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onDiscussSimilar(project);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#252B29] px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#171919] transition-colors cursor-pointer"
          >
            Хочу похожий проект
          </button>
        </div>
      </div>
    </div>
  );
}

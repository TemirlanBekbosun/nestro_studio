import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BrainCircuit,
  Check,
  ChevronDown,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  AiArchitectureAdvice,
  AutomationOptionId,
  FaqItem,
  InquiryFormInput,
  SiteFormatId,
  StudioProfile,
} from '../types/studio.ts';
import {
  AUTOMATION_OPTIONS,
  SITE_FORMATS,
  buildWhatsAppInquiryUrl,
  calculateProjectEstimate,
  clampPagesForFormat,
  formatKgs,
  isSafeHttpUrl,
  validateInquiryForm,
} from '../utils/studioLogic.ts';
import type { ValidationErrors } from '../utils/studioLogic.ts';

interface FaqAndContactSectionProps {
  faq: FaqItem[];
  studio: StudioProfile;
  selectedFormatId: SiteFormatId;
  onSelectFormatId: (formatId: SiteFormatId) => void;
  prefilledTaskHint?: string;
}

const FORMAT_LIST = Object.values(SITE_FORMATS);
const AUTOMATION_LIST = Object.values(AUTOMATION_OPTIONS);

export function FaqAndContactSection({
  faq,
  studio,
  selectedFormatId,
  onSelectFormatId,
  prefilledTaskHint,
}: FaqAndContactSectionProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(faq[0]?.id ?? null);

  // Calculator state
  const [pagesCount, setPagesCount] = useState<number>(
    SITE_FORMATS[selectedFormatId].defaultPages,
  );
  const [automations, setAutomations] = useState<AutomationOptionId[]>([
    'whatsapp-telegram',
  ]);

  // AI Architect state (optional high-thinking assistant)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AiArchitectureAdvice | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [businessSphere, setBusinessSphere] = useState('');
  const [contact, setContact] = useState('');
  const [budgetLabel, setBudgetLabel] = useState('');
  const [taskDescription, setTaskDescription] = useState(prefilledTaskHint || '');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<{
    input: InquiryFormInput;
    whatsappUrl: string;
    totalKgs: number;
  } | null>(null);

  // Sync pages when format changes externally or via buttons
  const currentFormatMeta = SITE_FORMATS[selectedFormatId];
  const clampedPages = clampPagesForFormat(selectedFormatId, pagesCount);

  const estimate = useMemo(
    () =>
      calculateProjectEstimate({
        formatId: selectedFormatId,
        pagesCount: clampedPages,
        automations,
        pageRateKgs: studio.pageRateKgs,
      }),
    [selectedFormatId, clampedPages, automations, studio.pageRateKgs],
  );

  const handleFormatChange = (formatId: SiteFormatId) => {
    onSelectFormatId(formatId);
    setPagesCount(SITE_FORMATS[formatId].defaultPages);
  };

  const toggleAutomation = (id: AutomationOptionId) => {
    setAutomations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleRunAiArchitect = async () => {
    setAiError(null);
    if (aiInput.trim().length < 8) {
      setAiError('Опишите ваш бизнес и задачу чуть подробнее (от 8 символов).');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDescription: aiInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiError(data.error || 'Не удалось выполнить подбор архитектуры.');
        return;
      }
      const advice = data as AiArchitectureAdvice;
      setAiAdvice(advice);
      onSelectFormatId(advice.recommendedFormatId);
      setPagesCount(advice.recommendedPages);
      setAutomations(advice.recommendedAutomations);
      if (!businessSphere.trim()) {
        setBusinessSphere(aiInput.trim().slice(0, 120));
      }
      if (!taskDescription.trim()) {
        setTaskDescription(advice.architectureSummary);
      }
    } catch {
      setAiError('Ошибка соединения с сервером при подборе архитектуры.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: InquiryFormInput = {
      name: name.trim(),
      company: company.trim(),
      businessSphere: businessSphere.trim(),
      contact: contact.trim(),
      formatId: selectedFormatId,
      pagesCount: clampedPages,
      automations,
      budgetLabel: budgetLabel.trim() || `~ ${formatKgs(estimate.totalKgs)}`,
      taskDescription: taskDescription.trim(),
    };

    const validation = validateInquiryForm(payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setSubmitError(data.error || 'Не удалось сохранить заявку.');
        return;
      }

      const whatsappUrl = buildWhatsAppInquiryUrl(
        studio.contacts.whatsappNumber,
        payload,
        estimate,
      );
      setSubmittedPayload({
        input: payload,
        whatsappUrl,
        totalKgs: estimate.totalKgs,
      });
    } catch {
      setSubmitError('Сетевая ошибка при отправке заявки. Попробуйте снова.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Block 9: FAQ */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium text-[#777D7D]">
                Частые вопросы
              </p>
              <h2
                className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#171919]"
                style={{ textWrap: 'balance' }}
              >
                Понятные ответы до начала работы
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#777D7D]">
                Никаких скрытых условий. Если вашего вопроса нет в списке —
                напишите напрямую в WhatsApp или Telegram.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-3">
              {faq.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className="glass-surface rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left cursor-pointer hover:bg-white/60 transition-colors"
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#171919]">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#777D7D] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-sm leading-relaxed text-[#777D7D] border-t border-[#E8EBEB]/70">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Block 10: Interactive Cost & Automation Calculator + Lead Capture */}
      <section id="contact" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-[#777D7D]">
              Калькулятор проекта и заявка
            </p>
            <h2
              className="mt-2 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[#171919]"
              style={{ textWrap: 'balance' }}
            >
              Есть идея для проекта? Давайте обсудим, как воплотить её в жизнь
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#777D7D]">
              Соберите ориентировочную конфигурацию сайта: выберите формат,
              количество страниц (база {formatKgs(studio.pageRateKgs)} за страницу)
              и нужные модули автоматизации 24/7. После отправки вы сразу
              сможете передать готовый расчёт в WhatsApp.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Estimator & Management Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              <div className="glass-surface-strong rounded-3xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8EBEB]">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#171919]">
                      1. Тип сайта и масштаб
                    </h3>
                    <p className="text-xs text-[#777D7D]">
                      Прозрачный расчёт от {formatKgs(studio.pageRateKgs)} за страницу
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-2 text-xs font-medium text-[#171919] hover:bg-[#F7F8F8] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-[#252B29]" />
                    <span>Подобрать архитектуру с ИИ</span>
                  </button>
                </div>

                {/* Optional High-Thinking AI Architecture Advisor */}
                {aiOpen && (
                  <div className="mt-4 rounded-2xl border border-[#D1D5D5] bg-white/85 p-4 space-y-3">
                    <label
                      htmlFor="ai-business-input"
                      className="block text-xs font-semibold text-[#171919]"
                    >
                      Опишите ваш бизнес и цель сайта
                    </label>
                    <textarea
                      id="ai-business-input"
                      rows={2}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Например: сеть кофеен в Бишкеке, хотим сайт с меню, предзаказом и чтобы заявки сразу падали в CRM и WhatsApp"
                      className="w-full rounded-xl border border-[#D1D5D5] bg-[#F7F8F8] px-3.5 py-2.5 text-xs sm:text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                    />
                    {aiError && (
                      <p className="text-xs text-red-700" role="alert">
                        {aiError}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#777D7D]">
                        Анализирует задачу и сам выставляет параметры ниже
                      </span>
                      <button
                        type="button"
                        onClick={handleRunAiArchitect}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#252B29] px-4 py-2 text-xs font-semibold text-white hover:bg-[#171919] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{aiLoading ? 'Анализируем...' : 'Подобрать решение'}</span>
                      </button>
                    </div>
                    {aiAdvice && (
                      <div className="pt-3 border-t border-[#E8EBEB] space-y-2 text-xs text-[#171919]">
                        <p className="font-semibold">Рекомендация применёна к расчёту:</p>
                        <p className="text-[#777D7D] leading-relaxed">
                          {aiAdvice.architectureSummary}
                        </p>
                        <p className="text-[#777D7D] leading-relaxed">
                          <span className="font-medium text-[#171919]">Автоматизация: </span>
                          {aiAdvice.automationImpact}
                        </p>
                        <p className="text-[#777D7D] leading-relaxed">
                          <span className="font-medium text-[#171919]">Управление: </span>
                          {aiAdvice.managementWorkflow}
                        </p>
                        {aiAdvice.firstSteps.length > 0 && (
                          <div>
                            <p className="font-medium text-[#171919]">Первые шаги:</p>
                            <ol className="mt-1 list-decimal space-y-1 pl-4 text-[#777D7D]">
                              {aiAdvice.firstSteps.map((step, index) => (
                                <li key={`${index}-${step}`}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Format selector */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FORMAT_LIST.map((fmt) => {
                    const active = fmt.id === selectedFormatId;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleFormatChange(fmt.id)}
                        aria-pressed={active}
                        className={`text-left rounded-2xl p-3.5 border transition-all duration-150 cursor-pointer ${
                          active
                            ? 'bg-[#252B29] text-white border-[#252B29]'
                            : 'bg-white/75 text-[#171919] border-[#E8EBEB] hover:border-[#D1D5D5]'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold">
                          {fmt.shortLabel}
                        </div>
                        <div
                          className={`mt-1 text-[11px] leading-snug ${
                            active ? 'text-[#D1D5D5]' : 'text-[#777D7D]'
                          }`}
                        >
                          {fmt.minPages === 1 && fmt.maxPages <= 2
                            ? `от ${formatKgs(studio.pageRateKgs)}`
                            : `от ${fmt.minPages} стр. · ${formatKgs(studio.pageRateKgs)}/стр.`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#777D7D]">
                  {currentFormatMeta.description}
                </p>

                {/* Page count slider */}
                <div className="mt-5 pt-5 border-t border-[#E8EBEB]">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="pages-range"
                      className="text-xs sm:text-sm font-semibold text-[#171919]"
                    >
                      Количество страниц
                    </label>
                    <span className="font-mono-num text-sm font-semibold text-[#171919]">
                      {clampedPages} стр. × {formatKgs(studio.pageRateKgs)}
                    </span>
                  </div>
                  <input
                    id="pages-range"
                    type="range"
                    min={currentFormatMeta.minPages}
                    max={currentFormatMeta.maxPages}
                    value={clampedPages}
                    onChange={(e) => setPagesCount(Number(e.target.value))}
                    className="mt-3 w-full accent-[#252B29] cursor-pointer"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-mono-num text-[#777D7D]">
                    <span>{currentFormatMeta.minPages} стр.</span>
                    <span>{currentFormatMeta.maxPages} стр.</span>
                  </div>
                </div>

                {/* Automation modules */}
                <div className="mt-5 pt-5 border-t border-[#E8EBEB]">
                  <div className="text-xs sm:text-sm font-semibold text-[#171919]">
                    2. Автоматизация бизнеса и управление 24/7
                  </div>
                  <p className="mt-1 text-xs text-[#777D7D]">
                    Выберите опции, чтобы заявки обрабатывались мгновенно без потери клиентов:
                  </p>

                  <div className="mt-3 space-y-2.5">
                    {AUTOMATION_LIST.map((opt) => {
                      const checked = automations.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleAutomation(opt.id)}
                          aria-pressed={checked}
                          className={`w-full text-left rounded-2xl p-3.5 border transition-colors cursor-pointer flex items-start gap-3 ${
                            checked
                              ? 'border-[#252B29] bg-white'
                              : 'border-[#E8EBEB] bg-white/60 hover:bg-white'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              checked
                                ? 'bg-[#252B29] border-[#252B29] text-white'
                                : 'border-[#D1D5D5] bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-xs sm:text-[13px] font-semibold text-[#171919]">
                                {opt.title}
                              </span>
                              <span className="font-mono-num text-xs font-medium text-[#777D7D]">
                                +{formatKgs(opt.costKgs)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#777D7D]">
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live estimate total */}
                <div className="mt-6 rounded-2xl bg-[#252B29] text-white p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs text-[#D1D5D5]">
                      Предварительный расчёт проекта
                    </span>
                    <span className="font-mono-num text-xs text-[#D1D5D5]">
                      Срок: {estimate.timelineLabel}
                    </span>
                  </div>
                  <div
                    data-testid="estimate-total"
                    className="mt-1.5 font-mono-num text-2xl sm:text-3xl font-semibold tracking-tight"
                  >
                    {formatKgs(estimate.totalKgs)}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#D1D5D5] font-mono-num">
                    <span>Страницы: {formatKgs(estimate.pagesCostKgs)}</span>
                    {estimate.architectureBaseKgs > 0 && (
                      <span>Модуль системы: {formatKgs(estimate.architectureBaseKgs)}</span>
                    )}
                    <span>Автоматизация: {formatKgs(estimate.automationsCostKgs)}</span>
                  </div>
                </div>
              </div>

              {/* Who manages what panel */}
              <div className="glass-surface rounded-3xl p-6">
                <h3 className="text-sm font-semibold text-[#171919]">
                  Кто и как будет управлять сайтом после запуска
                </h3>
                <div className="mt-4 space-y-3">
                  {estimate.managementPlan.map((role, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#E8EBEB] bg-white/75 p-4"
                    >
                      <div className="text-xs font-semibold text-[#171919]">
                        {role.actor}
                      </div>
                      <div className="mt-1 text-xs font-medium text-[#252B29]">
                        {role.responsibility}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#777D7D]">
                        {role.workflow}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Lead Capture Form & Instant WhatsApp Dispatch */}
            <div className="lg:col-span-6 space-y-6">
              <div className="glass-surface-strong rounded-3xl p-6 sm:p-8">
                {submittedPayload ? (
                  <div
                    data-testid="inquiry-success"
                    className="space-y-5 py-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#252B29] text-white flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-[#171919]">
                        Заявка сохранена
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
                        Спасибо, {submittedPayload.input.name}! Ваш расчёт на{' '}
                        <span className="font-mono-num font-semibold text-[#171919]">
                          {formatKgs(submittedPayload.totalKgs)}
                        </span>{' '}
                        успешно зафиксирован в системе. Нажмите кнопку ниже, чтобы
                        сразу открыть диалог в WhatsApp с заполненным описанием
                        задачи.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#E8EBEB] bg-white/80 p-4 text-xs space-y-1.5 text-[#171919]">
                      <div>
                        <span className="text-[#777D7D]">Формат: </span>
                        {estimate.formatTitle} ({estimate.pagesCount} стр.)
                      </div>
                      <div>
                        <span className="text-[#777D7D]">Сфера бизнеса: </span>
                        {submittedPayload.input.businessSphere}
                      </div>
                      <div>
                        <span className="text-[#777D7D]">Контакт: </span>
                        {submittedPayload.input.contact}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={submittedPayload.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#252B29] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#171919] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Отправить заявку в WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setSubmittedPayload(null)}
                        className="rounded-xl border border-[#D1D5D5] bg-white px-5 py-3.5 text-xs font-semibold text-[#171919] hover:bg-[#F7F8F8] cursor-pointer"
                      >
                        Изменить параметры
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="pb-3 border-b border-[#E8EBEB]">
                      <h3 className="font-display text-lg font-semibold text-[#171919]">
                        Оставьте заявку на обсуждение
                      </h3>
                      <p className="mt-1 text-xs text-[#777D7D]">
                        Параметры из калькулятора прикрепятся автоматически.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lead-name"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          Ваше имя *
                        </label>
                        <input
                          id="lead-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Например, Азамат"
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                        />
                        {fieldErrors.name && (
                          <p className="mt-1 text-xs text-red-700" role="alert">
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lead-company"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          Название компании (необязательно)
                        </label>
                        <input
                          id="lead-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Например, Optika Studio"
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lead-sphere"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          Какой у вас бизнес? *
                        </label>
                        <input
                          id="lead-sphere"
                          type="text"
                          value={businessSphere}
                          onChange={(e) => setBusinessSphere(e.target.value)}
                          placeholder="Салон, клиника, магазин, услуги..."
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                        />
                        {fieldErrors.businessSphere && (
                          <p className="mt-1 text-xs text-red-700" role="alert">
                            {fieldErrors.businessSphere}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lead-contact"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          WhatsApp, Telegram или телефон *
                        </label>
                        <input
                          id="lead-contact"
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="+996 555 123 456 или @username"
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                        />
                        {fieldErrors.contact && (
                          <p className="mt-1 text-xs text-red-700" role="alert">
                            {fieldErrors.contact}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lead-format"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          Тип сайта
                        </label>
                        <select
                          id="lead-format"
                          value={selectedFormatId}
                          onChange={(e) =>
                            handleFormatChange(e.target.value as SiteFormatId)
                          }
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] focus:outline-2 focus:outline-[#252B29]"
                        >
                          {FORMAT_LIST.map((fmt) => (
                            <option key={fmt.id} value={fmt.id}>
                              {fmt.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="lead-budget"
                          className="block text-xs font-medium text-[#171919] mb-1.5"
                        >
                          Ориентир по бюджету
                        </label>
                        <input
                          id="lead-budget"
                          type="text"
                          value={budgetLabel}
                          onChange={(e) => setBudgetLabel(e.target.value)}
                          placeholder={`По расчёту: ${formatKgs(estimate.totalKgs)}`}
                          className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="lead-task"
                        className="block text-xs font-medium text-[#171919] mb-1.5"
                      >
                        Что хотите сделать и какие задачи решить? *
                      </label>
                      <textarea
                        id="lead-task"
                        rows={4}
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Опишите кратко, какие разделы нужны, нужна ли онлайн-запись, каталог или интеграция с CRM и WhatsApp..."
                        className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-sm text-[#171919] placeholder:text-[#777D7D] focus:outline-2 focus:outline-[#252B29]"
                      />
                      {fieldErrors.taskDescription && (
                        <p className="mt-1 text-xs text-red-700" role="alert">
                          {fieldErrors.taskDescription}
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <p className="text-xs text-red-700" role="alert">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B29] px-6 py-4 text-sm font-semibold text-white hover:bg-[#171919] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {submitting
                          ? 'Сохраняем заявку...'
                          : 'Отправить заявку и подготовить WhatsApp'}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {/* Quick direct communication channels */}
              <div className="glass-surface rounded-3xl p-6">
                <div className="text-xs font-medium text-[#777D7D]">
                  Быстрые способы связи
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/${studio.contacts.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-[#E8EBEB] bg-white/80 px-4 py-3.5 text-xs sm:text-sm font-medium text-[#171919] hover:border-[#252B29]/40 transition-colors"
                  >
                    <span>WhatsApp</span>
                    <span className="text-xs text-[#777D7D] font-mono-num">
                      {studio.contacts.whatsappDisplay}
                    </span>
                  </a>

                  {isSafeHttpUrl(studio.contacts.telegramUrl) && (
                    <a
                      href={studio.contacts.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-[#E8EBEB] bg-white/80 px-4 py-3.5 text-xs sm:text-sm font-medium text-[#171919] hover:border-[#252B29]/40 transition-colors"
                    >
                      <span>Telegram</span>
                      <span className="text-xs text-[#777D7D]">
                        {studio.contacts.telegramDisplay}
                      </span>
                    </a>
                  )}

                  {isSafeHttpUrl(studio.contacts.instagramUrl) && (
                    <a
                      href={studio.contacts.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-[#E8EBEB] bg-white/80 px-4 py-3.5 text-xs sm:text-sm font-medium text-[#171919] hover:border-[#252B29]/40 transition-colors"
                    >
                      <span>Instagram</span>
                      <span className="text-xs text-[#777D7D]">
                        {studio.contacts.instagramDisplay}
                      </span>
                    </a>
                  )}

                  <a
                    href={`mailto:${studio.contacts.email}`}
                    className="flex items-center justify-between rounded-2xl border border-[#E8EBEB] bg-white/80 px-4 py-3.5 text-xs sm:text-sm font-medium text-[#171919] hover:border-[#252B29]/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#777D7D]" />
                      <span>Email</span>
                    </span>
                    <span className="text-xs text-[#777D7D] truncate max-w-[160px]">
                      {studio.contacts.email}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { ArrowRight, Bot, CalendarCheck, Layers, ShoppingBag, Sparkles, Workflow } from 'lucide-react';
import type { ServiceItem, SiteFormatId } from '../types/studio.ts';

interface ServicesAndBenefitsSectionProps {
  services: ServiceItem[];
  onSelectService: (formatId: SiteFormatId) => void;
}

const CLIENT_BENEFITS = [
  {
    title: 'Доверие с первого открытия',
    situation: 'Аккуратный сайт сразу объясняет, чем полезна компания.',
  },
  {
    title: 'Заявки приходят 24/7',
    situation: 'CRM и мессенджеры фиксируют обращение без задержек.',
  },
  {
    title: 'Удобно с телефона',
    situation: 'Клиент быстро находит услугу, цену и способ связи.',
  },
  {
    title: 'Можно развивать дальше',
    situation: 'Сайт легко дополняется каталогом, записью и CRM.',
  },
];

function ServiceIcon({ formatId }: { formatId: SiteFormatId }) {
  const cls = 'w-5 h-5 text-[#252B29]';
  switch (formatId) {
    case 'single-page':
      return <Sparkles className={cls} strokeWidth={1.6} />;
    case 'catalog':
      return <ShoppingBag className={cls} strokeWidth={1.6} />;
    case 'booking':
      return <CalendarCheck className={cls} strokeWidth={1.6} />;
    case 'custom':
      return <Workflow className={cls} strokeWidth={1.6} />;
    default:
      return <Layers className={cls} strokeWidth={1.6} />;
  }
}

export function ServicesAndBenefitsSection({
  services,
  onSelectService,
}: ServicesAndBenefitsSectionProps) {
  return (
    <>
      {/* Block 4: Services */}
      <section id="services" className="scroll-mt-20 py-14 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[14px] font-semibold text-[#777D7D]">
              Что мы создаём
            </p>
            <h2
              className="mt-2 font-display text-[30px] sm:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#171919]"
              style={{ textWrap: 'balance' }}
            >
              Решение под задачу вашего бизнеса
            </h2>
            <p className="mt-3 text-[16px] sm:text-[18px] leading-[1.65] text-[#686E6D]">
              От лендинга до каталога с записью и CRM.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              const spanClass = 'col-span-1';
              return (
                <article
                  key={service.id}
                  className={`${spanClass} glass-surface glass-card-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono-num text-xs font-medium text-[#777D7D]">
                        {service.number}
                      </span>
                      <div className="w-10 h-10 rounded-xl border border-[#E8EBEB] bg-white/80 flex items-center justify-center">
                        <ServiceIcon formatId={service.formatId} />
                      </div>
                    </div>

                    <h3 className="mt-5 font-display text-[21px] sm:text-[23px] leading-[1.25] font-semibold text-[#171919]">
                      {service.title}
                    </h3>

                    <p className="mt-2.5 text-[16px] leading-[1.55] text-[#686E6D]">
                      {service.description}
                    </p>

                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8EBEB]">
                    <button
                      type="button"
                      onClick={() => onSelectService(service.formatId)}
                      className="min-h-11 inline-flex items-center gap-2 text-[16px] font-semibold text-[#171919] hover:text-[#777D7D] transition-colors cursor-pointer"
                    >
                      <span>Обсудить проект</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Block 5: Client Value & 24/7 Automation Spotlight */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Spotlight banner on 24/7 CRM Automation */}
          <div className="glass-surface-strong rounded-3xl p-7 sm:p-10 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#777D7D]">
                  <Bot className="w-4 h-4 text-[#252B29]" />
                  <span>Ключевой фокус NESTRO · Автоматизация бизнеса</span>
                </div>
                <h2
                  className="mt-3 font-display text-[30px] sm:text-[38px] font-semibold leading-[1.12] tracking-tight text-[#171919]"
                  style={{ textWrap: 'balance' }}
                >
                  Заявки не теряются в переписках
                </h2>
                <p className="mt-3 text-[16px] sm:text-[18px] leading-[1.65] text-[#686E6D]">
                  Сайт фиксирует обращение и сразу передаёт его в CRM и мессенджер.
                </p>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-[#E8EBEB] bg-white/80 p-4">
                  <div className="text-[14px] font-semibold text-[#171919]">
                    01. Запрос с сайта
                  </div>
                  <p className="mt-1 text-[14px] leading-[1.5] text-[#686E6D]">
                    Клиент оставляет заявку в удобное время.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E8EBEB] bg-white/80 p-4">
                  <div className="text-[14px] font-semibold text-[#171919]">
                    02. Передача в CRM
                  </div>
                  <p className="mt-1 text-[14px] leading-[1.5] text-[#686E6D]">
                    Карточка создаётся автоматически.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E8EBEB] bg-white/80 p-4">
                  <div className="text-[14px] font-semibold text-[#171919]">
                    03. Контроль процесса
                  </div>
                  <p className="mt-1 text-[14px] leading-[1.5] text-[#686E6D]">
                    Все обращения остаются в одном месте.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-[14px] font-semibold text-[#777D7D]">
              Что получает бизнес
            </p>
            <h2
              className="mt-2 font-display text-[30px] sm:text-[38px] font-semibold leading-[1.12] tracking-tight text-[#171919]"
              style={{ textWrap: 'balance' }}
            >
              Четыре полезных результата
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLIENT_BENEFITS.map((item, idx) => (
              <div
                key={idx}
                className="glass-surface rounded-2xl p-6"
              >
                <div className="font-mono-num text-xs text-[#777D7D]">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-2 text-[19px] sm:text-[21px] leading-[1.25] font-semibold text-[#171919]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[16px] leading-[1.55] text-[#686E6D]">
                  {item.situation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

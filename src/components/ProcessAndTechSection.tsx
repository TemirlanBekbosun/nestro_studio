import { useState } from 'react';

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Знакомство и обсуждение',
    studioAction:
      'Изучаем специфику вашего бизнеса, целевую аудиторию, текущие точки потери клиентов и задачи будущего сайта.',
    clientAction:
      'Рассказываете о компании, продуктах и желаемом результате своими словами — без сложных технических брифов.',
  },
  {
    number: '02',
    title: 'Анализ и планирование',
    studioAction:
      'Формируем карту страниц, определяем нужные функции (онлайн-запись, каталог, CRM) и фиксируем прозрачную смету от 5 000 сом за страницу.',
    clientAction:
      'Согласовываете структуру сайта, приоритетный набор функций и формат дальнейшего управления контентом.',
  },
  {
    number: '03',
    title: 'Дизайн и прототип',
    studioAction:
      'Проектируем логику экранов, пользовательский путь с компьютера и телефона, а также аккуратную визуальную систему.',
    clientAction:
      'Смотрите прототип, оставляете комментарии по подаче и передаёте фото или логотип, если они уже готовы.',
  },
  {
    number: '04',
    title: 'Разработка',
    studioAction:
      'Пишем чистый код, адаптируем сайт под мобильные устройства (Mobile First), подключаем формы, WhatsApp, Telegram и CRM-интеграции.',
    clientAction:
      'Наблюдаете за прогрессом на тестовой ссылке и при необходимости уточняете тексты.',
  },
  {
    number: '05',
    title: 'Проверка и тестирование',
    studioAction:
      'Тестируем каждую кнопку, валидацию форм, скорость загрузки изображений, SEO-разметку и отображение на разных экранах.',
    clientAction:
      'Проверяете работу заявок со своего телефона и убеждаетесь, что уведомления приходят мгновенно.',
  },
  {
    number: '06',
    title: 'Запуск проекта',
    studioAction:
      'Привязываем ваш домен, настраиваем защищённое соединение (HTTPS), размещаем сайт на сервере и передаём доступы к админ-панели.',
    clientAction:
      'Принимаете готовый рабочий продукт и сразу направляете на него клиентов и рекламу.',
  },
  {
    number: '07',
    title: 'Поддержка и развитие',
    studioAction:
      'Помогаем обновлять разделы, исправлять мелкие недочёты, подключать новые воронки и масштабировать платформу по мере роста.',
    clientAction:
      'Обращаетесь с новыми идеями или управляете текущим контентом самостоятельно через админ-панель.',
  },
];

const WORK_PRINCIPLES = [
  'Сначала глубоко понимаем задачу бизнеса, и только потом предлагаем техническое решение.',
  'Делаем интерфейсы интуитивно понятными для обычных покупателей, без лишних шагов.',
  'Учитываем мобильные устройства с самого первого экрана — большая часть трафика идёт со смартфонов.',
  'Не перегружаем сайт ненужными виджетами и тяжёлой анимацией ради количества.',
  'Тщательно проверяем формы, ссылки и скорость загрузки перед выходом в сеть.',
  'Открыто согласовываем ключевые решения по структуре и бюджету на каждом этапе.',
  'Закладываем архитектуру, которую легко развивать и дополнять в будущем.',
];

const TECH_STACK = [
  {
    name: 'React',
    role: 'Быстрые интерактивные интерфейсы и многостраничные веб-приложения без лишних перезагрузок.',
  },
  {
    name: 'JavaScript и TypeScript',
    role: 'Надёжная логика форм, калькуляторов стоимости, фильтрации каталогов и онлайн-записи.',
  },
  {
    name: 'HTML и CSS',
    role: 'Семантическая вёрстка для SEO, чёткая адаптивность под все экраны и аккуратные визуальные эффекты.',
  },
  {
    name: 'REST API',
    role: 'Обмен данными между сайтом, серверной частью, платёжными и CRM-сервисами.',
  },
  {
    name: 'Redux Toolkit',
    role: 'Предсказуемое управление состоянием в сложных каталогах, корзинах и личных кабинетах.',
  },
  {
    name: 'Базы данных',
    role: 'Надёжное хранение заявок, проектов, товаров, записей клиентов и материалов админ-панели.',
  },
  {
    name: 'Интеграции с внешними сервисами',
    role: 'Подключение WhatsApp, Telegram-ботов, CRM-систем и уведомлений о сделках 24/7.',
  },
];

export function ProcessAndTechSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = PROCESS_STEPS[activeStepIndex];

  return (
    <>
      {/* Block 6: How website creation works */}
      <section id="process" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[14px] font-semibold text-[#777D7D]">
              Как мы работаем
            </p>
            <h2
              className="mt-2 font-display text-[30px] sm:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#171919]"
              style={{ textWrap: 'balance' }}
            >
              От идеи до запуска за семь этапов
            </h2>
            <p className="mt-3 text-[16px] sm:text-[18px] leading-[1.65] text-[#686E6D]">
              Вы всегда понимаете следующий шаг.
            </p>
          </div>

          {/* Interactive Timeline Selector */}
          <div className="mt-10 relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-7 left-6 right-6 h-px bg-[#D1D5D5]"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {PROCESS_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    aria-pressed={isActive}
                    className={`relative text-left rounded-2xl p-4 transition-all duration-150 cursor-pointer border ${
                      isActive
                        ? 'bg-[#252B29] text-white border-[#252B29] shadow-md'
                        : 'glass-surface text-[#171919] hover:border-[#252B29]/30'
                    }`}
                  >
                    <div
                      className={`font-mono-num text-xs font-semibold ${
                        isActive ? 'text-[#D1D5D5]' : 'text-[#777D7D]'
                      }`}
                    >
                      {step.number}
                    </div>
                    <div className="mt-1.5 text-xs sm:text-[13px] font-semibold leading-snug">
                      {step.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active stage detail panel */}
            <div className="mt-5 glass-surface-strong rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#E8EBEB]">
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#171919]">
                  {activeStep.number}. {activeStep.title}
                </h3>
                <span className="font-mono-num text-xs text-[#777D7D]">
                  Этап {activeStepIndex + 1} из {PROCESS_STEPS.length}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-[#E8EBEB] bg-white/75 p-5">
                  <div className="text-xs font-semibold text-[#171919]">
                    Что делаем мы в NESTRO
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
                    {activeStep.studioAction}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8EBEB] bg-white/75 p-5">
                  <div className="text-xs font-semibold text-[#171919]">
                    Что потребуется от вас
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#777D7D]">
                    {activeStep.clientAction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 7 & 8: Approach Principles & Tech Stack */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Block 7: Principles */}
            <div className="lg:col-span-5 glass-surface rounded-3xl p-7 sm:p-9 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-[#777D7D]">
                  Наш подход к работе
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#171919]">
                  Инженерная дисциплина и здравый смысл
                </h2>
                <ul className="mt-6 space-y-3.5">
                  {WORK_PRINCIPLES.map((principle, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[#171919]"
                    >
                      <span className="font-mono-num text-xs text-[#777D7D] mt-1">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Block 8: Tech stack */}
            <div className="lg:col-span-7 glass-surface rounded-3xl p-7 sm:p-9">
              <p className="text-xs font-medium text-[#777D7D]">
                Технологии и возможности
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#171919]">
                Надёжные инструменты, на которых строятся наши проекты
              </h2>
              <p className="mt-2.5 text-sm text-[#777D7D]">
                Используем только проверенный стек, с которым уверенно работаем в
                реальных проектах — без лишних модных слов.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TECH_STACK.map((tech) => (
                  <div
                    key={tech.name}
                    className="rounded-2xl border border-[#E8EBEB] bg-white/75 p-4"
                  >
                    <div className="text-sm font-semibold text-[#171919]">
                      {tech.name}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#777D7D]">
                      {tech.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

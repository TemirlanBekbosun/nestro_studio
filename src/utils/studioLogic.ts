import type {
  AutomationOptionId,
  EstimateInput,
  EstimateResult,
  InquiryFormInput,
  ManagementRole,
  SiteFormatId,
} from '../types/studio.ts';

export const DEFAULT_PAGE_RATE_KGS = 5000;

export interface SiteFormatMeta {
  id: SiteFormatId;
  title: string;
  shortLabel: string;
  description: string;
  minPages: number;
  maxPages: number;
  defaultPages: number;
  architectureFeeKgs: number;
  daysMin: number;
  daysMax: number;
}

export const SITE_FORMATS: Record<SiteFormatId, SiteFormatMeta> = {
  'single-page': {
    id: 'single-page',
    title: 'Одностраничный сайт (Лендинг)',
    shortLabel: 'Одностраничный',
    description:
      'Фокус на одном товаре, услуге или событии. Понятная структура от первого экрана до заявки.',
    minPages: 1,
    maxPages: 2,
    defaultPages: 1,
    architectureFeeKgs: 0,
    daysMin: 3,
    daysMax: 6,
  },
  'multi-page': {
    id: 'multi-page',
    title: 'Многостраничный сайт компании',
    shortLabel: 'Многостраничный',
    description:
      'Полноценное представительство бизнеса: главная, услуги, портфолио, о компании, контакты.',
    minPages: 3,
    maxPages: 15,
    defaultPages: 5,
    architectureFeeKgs: 0,
    daysMin: 7,
    daysMax: 14,
  },
  catalog: {
    id: 'catalog',
    title: 'Интернет-магазин и каталог',
    shortLabel: 'Каталог / Магазин',
    description:
      'Категории, карточки товаров, фильтрация, корзина и оформление заказа с уведомлением менеджера.',
    minPages: 4,
    maxPages: 15,
    defaultPages: 6,
    architectureFeeKgs: 5000,
    daysMin: 10,
    daysMax: 21,
  },
  booking: {
    id: 'booking',
    title: 'Система онлайн-записи и бронирования',
    shortLabel: 'Онлайн-запись',
    description:
      'Выбор услуги, специалиста, даты и свободного времени с автоматическим подтверждением.',
    minPages: 3,
    maxPages: 12,
    defaultPages: 4,
    architectureFeeKgs: 5000,
    daysMin: 8,
    daysMax: 16,
  },
  custom: {
    id: 'custom',
    title: 'Индивидуальное цифровое решение',
    shortLabel: 'Индивидуальный проект',
    description:
      'Личные кабинеты, внутренние панели управления, нестандартная логика и интеграции под процессы.',
    minPages: 4,
    maxPages: 15,
    defaultPages: 6,
    architectureFeeKgs: 10000,
    daysMin: 14,
    daysMax: 30,
  },
};

export interface AutomationMeta {
  id: AutomationOptionId;
  title: string;
  description: string;
  costKgs: number;
  whoManages: string;
}

export const AUTOMATION_OPTIONS: Record<AutomationOptionId, AutomationMeta> = {
  'whatsapp-telegram': {
    id: 'whatsapp-telegram',
    title: 'Мгновенные заявки в WhatsApp и Telegram 24/7',
    description:
      'Каждое обращение с сайта сразу уходит в рабочий чат с именем, услугой и бюджетом — клиент не ждёт.',
    costKgs: 2500,
    whoManages: 'Менеджер или владелец отвечает прямо в привычном мессенджере.',
  },
  'crm-sync': {
    id: 'crm-sync',
    title: 'CRM-интеграция и автоответ без задержек',
    description:
      'Автоматическое создание карточки сделки в CRM и мгновенное подтверждение клиенту, исключая человеческий фактор.',
    costKgs: 5000,
    whoManages: 'CRM автоматически фиксирует статусы, напоминания и историю диалога.',
  },
  'online-booking': {
    id: 'online-booking',
    title: 'Календарь записи и расписание специалистов',
    description:
      'Клиенты самостоятельно выбирают удобный слот, а расписание обновляется без участия администратора.',
    costKgs: 4500,
    whoManages: 'Администратор или мастера видят актуальное расписание в едином окне.',
  },
  'admin-cms': {
    id: 'admin-cms',
    title: 'Панель управления контентом (Админ-панель)',
    description:
      'Самостоятельное добавление товаров, проектов, цен, акций и вопросов без правки кода.',
    costKgs: 4000,
    whoManages: 'Владелец или контент-менеджер редактирует сайт через защищённый вход.',
  },
};

export function clampPagesForFormat(
  formatId: SiteFormatId,
  rawPages: number,
): number {
  const meta = SITE_FORMATS[formatId];
  const safeNum = Number.isFinite(rawPages) ? Math.round(rawPages) : meta.defaultPages;
  return Math.max(meta.minPages, Math.min(meta.maxPages, safeNum));
}

export function getManagementPlan(
  formatId: SiteFormatId,
  automations: AutomationOptionId[],
): ManagementRole[] {
  const hasCrm = automations.includes('crm-sync');
  const hasMsg = automations.includes('whatsapp-telegram');
  const hasBooking = automations.includes('online-booking') || formatId === 'booking';
  const hasCms = automations.includes('admin-cms') || formatId === 'catalog' || formatId === 'custom';

  const plan: ManagementRole[] = [
    {
      actor: 'Система автоматизации 24/7',
      responsibility: hasCrm
        ? 'Мгновенный приём заявок, запись в CRM и первичное подтверждение'
        : hasMsg
          ? 'Моментальная пересылка заявок в WhatsApp и Telegram без задержек'
          : 'Структурированный сбор заявок с сайта с проверкой контактов',
      workflow: hasCrm
        ? 'Работает круглосуточно без выходных: фиксирует каждый запрос и исключает потерю клиента.'
        : 'Заявка не теряется в почте — уведомление приходит сразу после нажатия кнопки.',
    },
    {
      actor: 'Владелец или менеджер',
      responsibility: hasBooking
        ? 'Подтверждение записей и консультация по сложным вопросам'
        : 'Общение с уже квалифицированным клиентом и закрытие сделки',
      workflow:
        'Получает готовую карточку с выбранной услугой, количеством страниц или товаром и бюджетом.',
    },
  ];

  if (hasCms) {
    plan.push({
      actor: 'Администратор сайта (без программиста)',
      responsibility: 'Обновление цен, услуг, кейсов, товаров и контактов',
      workflow:
        'Через закрытую админ-панель с паролем меняет тексты и загружает фото за пару минут.',
    });
  } else {
    plan.push({
      actor: 'Студия NESTRO (по запросу)',
      responsibility: 'Техническое сопровождение, обновления и развитие модулей',
      workflow:
        'При необходимости добавляем новые страницы, акции или интеграции без переделки сайта.',
    });
  }

  return plan;
}

export function calculateProjectEstimate(input: EstimateInput): EstimateResult {
  const format = SITE_FORMATS[input.formatId] ?? SITE_FORMATS['single-page'];
  const pageRate =
    input.pageRateKgs && input.pageRateKgs > 0
      ? Math.round(input.pageRateKgs)
      : DEFAULT_PAGE_RATE_KGS;

  const pagesCount = clampPagesForFormat(format.id, input.pagesCount);
  const pagesCostKgs = pagesCount * pageRate;

  const uniqueAutomations = Array.from(new Set(input.automations)).filter(
    (id): id is AutomationOptionId => id in AUTOMATION_OPTIONS,
  );

  const automationsCostKgs = uniqueAutomations.reduce(
    (sum, id) => sum + AUTOMATION_OPTIONS[id].costKgs,
    0,
  );

  const totalKgs = pagesCostKgs + format.architectureFeeKgs + automationsCostKgs;
  const extraDays = uniqueAutomations.length >= 2 ? 3 : uniqueAutomations.length === 1 ? 1 : 0;
  const timelineLabel = `${format.daysMin + extraDays}–${format.daysMax + extraDays} дней`;

  return {
    formatId: format.id,
    formatTitle: format.title,
    pagesCount,
    pageRateKgs: pageRate,
    pagesCostKgs,
    architectureBaseKgs: format.architectureFeeKgs,
    automationsCostKgs,
    totalKgs,
    timelineLabel,
    selectedAutomationLabels: uniqueAutomations.map((id) => AUTOMATION_OPTIONS[id].title),
    managementPlan: getManagementPlan(format.id, uniqueAutomations),
  };
}

export function formatKgs(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} сом`;
}

export interface ValidationErrors {
  name?: string;
  businessSphere?: string;
  contact?: string;
  taskDescription?: string;
}

export function validateInquiryForm(input: InquiryFormInput): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Укажите ваше имя (минимум 2 символа).';
  }
  if (!input.businessSphere || input.businessSphere.trim().length < 2) {
    errors.businessSphere = 'Укажите сферу бизнеса или направление проекта.';
  }

  const contactTrimmed = (input.contact || '').trim();
  const digits = contactTrimmed.replace(/\D/g, '');
  const looksLikeHandle = /^@[a-zA-Z0-9_]{3,}$/.test(contactTrimmed);
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactTrimmed);
  const looksLikePhone = digits.length >= 9 && digits.length <= 15;

  if (!contactTrimmed || (!looksLikePhone && !looksLikeHandle && !looksLikeEmail)) {
    errors.contact = 'Введите корректный телефон, WhatsApp, @telegram или email.';
  }

  if (!input.taskDescription || input.taskDescription.trim().length < 10) {
    errors.taskDescription = 'Коротко опишите задачу (от 10 символов), чтобы мы подготовили решение.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatWhatsAppMessage(
  input: InquiryFormInput,
  estimate: EstimateResult,
): string {
  const lines = [
    `Здравствуйте! Заявка с сайта NESTRO:`,
    `Имя: ${input.name.trim()}`,
    input.company.trim() ? `Компания: ${input.company.trim()}` : null,
    `Сфера бизнеса: ${input.businessSphere.trim()}`,
    `Контакт: ${input.contact.trim()}`,
    `Формат сайта: ${estimate.formatTitle}`,
    `Количество страниц: ${estimate.pagesCount} (по ${formatKgs(estimate.pageRateKgs)} / стр.)`,
    estimate.selectedAutomationLabels.length > 0
      ? `Автоматизация: ${estimate.selectedAutomationLabels.join(', ')}`
      : `Автоматизация: базовый приём заявок`,
    `Ориентировочный расчёт: ${formatKgs(estimate.totalKgs)}`,
    input.budgetLabel.trim() ? `Комфортный бюджет клиента: ${input.budgetLabel.trim()}` : null,
    `Задача: ${input.taskDescription.trim()}`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildWhatsAppInquiryUrl(
  rawWhatsappDigits: string,
  input: InquiryFormInput,
  estimate: EstimateResult,
): string {
  const cleanDigits = rawWhatsappDigits.replace(/\D/g, '');
  if (cleanDigits.length < 9) {
    return '#contact';
  }
  const message = formatWhatsAppMessage(input, estimate);
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

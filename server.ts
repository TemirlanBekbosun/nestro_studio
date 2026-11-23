import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { DEFAULT_STUDIO_DATA } from './src/data/defaultStudioData.ts';
import type {
  AutomationOptionId,
  FaqItem,
  InquiryFormInput,
  InquiryRecord,
  ProjectCase,
  ServiceItem,
  SiteFormatId,
  StudioDatabaseContent,
  StudioProfile,
} from './src/types/studio.ts';
import {
  calculateProjectEstimate,
  clampPagesForFormat,
  isSafeHttpUrl,
  validateInquiryForm,
} from './src/utils/studioLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOAD_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_PATH = path.resolve(DATA_DIR, 'studio-db.json');

const IN_MEMORY_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || IN_MEMORY_SESSION_SECRET;
}

interface AdminAuthRecord {
  email: string;
  salt: string;
  passwordHash: string;
  claimedAt: string;
}

interface PersistedDatabase extends StudioDatabaseContent {
  inquiries: InquiryRecord[];
  adminAuth: AdminAuthRecord | null;
}

function ensureStorageDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function loadDatabase(): PersistedDatabase {
  ensureStorageDirs();
  if (!fs.existsSync(DB_PATH)) {
    const initial: PersistedDatabase = {
      ...structuredClone(DEFAULT_STUDIO_DATA),
      inquiries: [],
      adminAuth: null,
    };
    saveDatabase(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;
    return {
      studio: parsed.studio ?? structuredClone(DEFAULT_STUDIO_DATA.studio),
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : structuredClone(DEFAULT_STUDIO_DATA.projects),
      services: Array.isArray(parsed.services)
        ? parsed.services
        : structuredClone(DEFAULT_STUDIO_DATA.services),
      faq: Array.isArray(parsed.faq)
        ? parsed.faq
        : structuredClone(DEFAULT_STUDIO_DATA.faq),
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      adminAuth: parsed.adminAuth ?? null,
    };
  } catch {
    const fallback: PersistedDatabase = {
      ...structuredClone(DEFAULT_STUDIO_DATA),
      inquiries: [],
      adminAuth: null,
    };
    saveDatabase(fallback);
    return fallback;
  }
}

function saveDatabase(db: PersistedDatabase): void {
  ensureStorageDirs();
  const tempPath = `${DB_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tempPath, DB_PATH);
}

function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPasswordTimingSafe(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + 12 * 60 * 60 * 1000,
      nonce: crypto.randomBytes(8).toString('hex'),
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  if (!verifyPasswordTimingSafe(sig, expectedSig)) return false;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { role?: string; exp?: number };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function extractBearerToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.slice('Bearer '.length).trim();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: 'Требуется авторизация администратора.' });
    return;
  }
  next();
}

function sanitizeText(value: unknown, maxLen = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function sanitizeStringArray(value: unknown, maxItems = 20, maxLen = 300): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getGeminiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Gemini отклонил запрос (400). Проверьте GEMINI_MODEL в .env.local.';
      case 401:
        return 'Gemini отклонил API-ключ (401). Проверьте ключ в .env.local или создайте новый.';
      case 403:
        return 'У API-ключа нет доступа к Gemini API (403). Проверьте настройки доступа и оплаты.';
      case 404:
        return 'Модель Gemini не найдена (404). Укажите доступную модель в GEMINI_MODEL.';
      case 429:
        return 'Превышен лимит запросов Gemini (429). Проверьте квоту и попробуйте позже.';
      case 503:
        return 'Все доступные модели Gemini временно перегружены (503). Попробуйте через минуту.';
      default:
        return `Gemini вернул ошибку HTTP ${error.status}. Попробуйте позже.`;
    }
  }

  if (error instanceof SyntaxError) {
    return 'Gemini вернул ответ в неподдерживаемом формате. Попробуйте ещё раз.';
  }

  return 'Не удалось связаться с Gemini. Проверьте интернет-соединение и журнал сервера.';
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  ensureStorageDirs();
  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      maxAge: '7d',
      fallthrough: false,
    }),
  );

  // Public studio content
  app.get('/api/content', (_req, res) => {
    const db = loadDatabase();
    res.json({
      studio: db.studio,
      projects: db.projects,
      services: db.services,
      faq: db.faq,
    });
  });

  // Public inquiry submission with server-side calculation & validation
  app.post('/api/inquiries', (req, res) => {
    const body = req.body as Partial<InquiryFormInput>;
    const validFormats: SiteFormatId[] = [
      'single-page',
      'multi-page',
      'catalog',
      'booking',
      'custom',
    ];
    const validAutomations: AutomationOptionId[] = [
      'whatsapp-telegram',
      'crm-sync',
      'online-booking',
      'admin-cms',
    ];

    const formatId: SiteFormatId = validFormats.includes(body.formatId as SiteFormatId)
      ? (body.formatId as SiteFormatId)
      : 'single-page';
    const automations = Array.isArray(body.automations)
      ? body.automations.filter((item): item is AutomationOptionId =>
          validAutomations.includes(item as AutomationOptionId),
        )
      : [];

    const db = loadDatabase();
    const pagesCount = clampPagesForFormat(formatId, Number(body.pagesCount || 1));

    const cleanInput: InquiryFormInput = {
      name: sanitizeText(body.name, 120),
      company: sanitizeText(body.company, 140),
      businessSphere: sanitizeText(body.businessSphere, 180),
      contact: sanitizeText(body.contact, 120),
      formatId,
      pagesCount,
      automations,
      budgetLabel: sanitizeText(body.budgetLabel, 100),
      taskDescription: sanitizeText(body.taskDescription, 2000),
    };

    const validation = validateInquiryForm(cleanInput);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Проверьте корректность заполнения полей заявки.',
        fieldErrors: validation.errors,
      });
      return;
    }

    const estimate = calculateProjectEstimate({
      formatId: cleanInput.formatId,
      pagesCount: cleanInput.pagesCount,
      automations: cleanInput.automations,
      pageRateKgs: db.studio.pageRateKgs,
    });

    const record: InquiryRecord = {
      ...cleanInput,
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      estimatedKgs: estimate.totalKgs,
      status: 'Новая',
      createdAt: new Date().toISOString(),
    };

    db.inquiries.unshift(record);
    saveDatabase(db);

    res.status(201).json({
      inquiry: record,
      estimate,
    });
  });

  // Server-side Gemini High-Thinking Architecture Advisor
  app.post('/api/ai/architecture', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'Сервис интеллектуального подбора архитектуры не настроен (отсутствует GEMINI_API_KEY на сервере). Вы можете воспользоваться калькулятором вручную.',
      });
      return;
    }

    const businessDescription = sanitizeText(req.body?.businessDescription, 1200);
    if (businessDescription.length < 8) {
      res.status(400).json({
        error: 'Опишите ваш бизнес и задачу чуть подробнее (от 8 символов).',
      });
      return;
    }

    try {
      const ai = createGeminiClient();
      const request = {
        contents: `Бизнес и задача клиента: ${businessDescription}`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction:
            'Ты ведущий архитектор цифровых продуктов веб-студии NESTRO. Пиши на живом, понятном русском языке для предпринимателя, без лишнего жаргона и выдуманных гарантий. Проанализируй задачу бизнеса и подбери оптимальный формат сайта, ориентировочное число страниц (от 1 до 12, база 5000 сом за страницу), нужные модули автоматизации 24/7 (whatsapp-telegram, crm-sync, online-booking, admin-cms) и объясни, кто и как будет управлять системой после запуска.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedFormatId: {
                type: Type.STRING,
                description:
                  'One of: single-page, multi-page, catalog, booking, custom',
              },
              recommendedPages: {
                type: Type.INTEGER,
                description: 'Recommended number of pages between 1 and 12',
              },
              recommendedAutomations: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description:
                  'Subset of: whatsapp-telegram, crm-sync, online-booking, admin-cms',
              },
              architectureSummary: {
                type: Type.STRING,
                description:
                  'Concise 2-3 sentence explanation of the recommended site structure in Russian.',
              },
              automationImpact: {
                type: Type.STRING,
                description:
                  'How 24/7 automation and CRM prevent losing leads in this specific business.',
              },
              managementWorkflow: {
                type: Type.STRING,
                description:
                  'Who manages what after launch (owner, manager, admin panel, 24/7 bot/CRM).',
              },
              firstSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 concrete first steps to launch this project.',
              },
            },
            required: [
              'recommendedFormatId',
              'recommendedPages',
              'recommendedAutomations',
              'architectureSummary',
              'automationImpact',
              'managementWorkflow',
              'firstSteps',
            ],
          },
        },
      };
      const configuredModel =
        process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
      const models = Array.from(
        new Set([
          configuredModel,
          'gemini-3.6-flash',
          'gemini-3.5-flash-lite',
        ]),
      );
      const response = await (async () => {
        for (const [index, model] of models.entries()) {
          try {
            return await ai.models.generateContent({ model, ...request });
          } catch (error) {
            if (
              !(error instanceof ApiError) ||
              error.status !== 503 ||
              index === models.length - 1
            ) {
              throw error;
            }
            console.warn(
              `Gemini model ${model} is overloaded; retrying with ${models[index + 1]}.`,
            );
          }
        }
        throw new Error('No Gemini model is configured for the request.');
      })();

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        recommendedFormatId?: string;
        recommendedPages?: number;
        recommendedAutomations?: string[];
        architectureSummary?: string;
        automationImpact?: string;
        managementWorkflow?: string;
        firstSteps?: string[];
      };

      const allowedFormats: SiteFormatId[] = [
        'single-page',
        'multi-page',
        'catalog',
        'booking',
        'custom',
      ];
      const allowedAutomations: AutomationOptionId[] = [
        'whatsapp-telegram',
        'crm-sync',
        'online-booking',
        'admin-cms',
      ];

      const formatId: SiteFormatId = allowedFormats.includes(
        parsed.recommendedFormatId as SiteFormatId,
      )
        ? (parsed.recommendedFormatId as SiteFormatId)
        : 'multi-page';

      const pages = clampPagesForFormat(
        formatId,
        Number(parsed.recommendedPages || 3),
      );
      const automations = Array.isArray(parsed.recommendedAutomations)
        ? parsed.recommendedAutomations.filter((item): item is AutomationOptionId =>
            allowedAutomations.includes(item as AutomationOptionId),
          )
        : ['whatsapp-telegram' as AutomationOptionId];

      res.json({
        recommendedFormatId: formatId,
        recommendedPages: pages,
        recommendedAutomations: automations,
        architectureSummary: sanitizeText(parsed.architectureSummary, 800),
        automationImpact: sanitizeText(parsed.automationImpact, 800),
        managementWorkflow: sanitizeText(parsed.managementWorkflow, 800),
        firstSteps: sanitizeStringArray(parsed.firstSteps, 5, 220),
      });
    } catch (error) {
      console.error('Gemini architecture request failed:', error);
      res.status(502).json({
        error: getGeminiErrorMessage(error),
      });
    }
  });

  // Admin auth status
  app.get('/api/admin/status', (req, res) => {
    const db = loadDatabase();
    const envConfigured = Boolean(
      process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim(),
    );
    const needsSetup = !envConfigured && !db.adminAuth;
    const authenticated = verifySessionToken(extractBearerToken(req));
    res.json({
      envConfigured,
      needsSetup,
      authenticated,
    });
  });

  // First-run admin password claim (only when ADMIN_PASSWORD is unset and not claimed yet)
  app.post('/api/admin/setup', (req, res) => {
    const envConfigured = Boolean(
      process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim(),
    );
    if (envConfigured) {
      res.status(409).json({
        error: 'Пароль администратора уже задан через настройки сервера.',
      });
      return;
    }

    const db = loadDatabase();
    if (db.adminAuth) {
      res.status(409).json({
        error: 'Пароль администратора уже был настроен ранее.',
      });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    if (!/^.{1,64}@.{1,255}\.[^.\s]{2,}$/.test(email)) {
      res.status(400).json({
        error: 'Введите корректный email администратора.',
      });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({
        error: 'Пароль должен содержать от 6 до 128 символов.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPasswordScrypt(password, salt);

    db.adminAuth = {
      email,
      salt,
      passwordHash,
      claimedAt: new Date().toISOString(),
    };
    saveDatabase(db);

    res.status(201).json({
      token: signSessionToken(),
    });
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    if (!email) {
      res.status(400).json({ error: 'Введите email администратора.' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Введите пароль администратора.' });
      return;
    }

    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (envEmail && envPassword) {
      if (email !== envEmail) {
        res.status(401).json({ error: 'Неверный email или пароль администратора.' });
        return;
      }
      if (!verifyPasswordTimingSafe(password, envPassword)) {
        res.status(401).json({ error: 'Неверный email или пароль администратора.' });
        return;
      }
      res.json({ token: signSessionToken() });
      return;
    }

    const db = loadDatabase();
    if (!db.adminAuth) {
      res.status(409).json({
        error: 'Пароль администратора ещё не создан. Выполните первичную настройку.',
      });
      return;
    }

    if (
      typeof db.adminAuth.email === 'string' &&
      email !== db.adminAuth.email.trim().toLowerCase()
    ) {
      res.status(401).json({ error: 'Неверный email или пароль администратора.' });
      return;
    }
    const candidateHash = hashPasswordScrypt(password, db.adminAuth.salt);
    if (!verifyPasswordTimingSafe(candidateHash, db.adminAuth.passwordHash)) {
      res.status(401).json({ error: 'Неверный пароль администратора.' });
      return;
    }

    res.json({ token: signSessionToken() });
  });

  // Protected Admin CRUD routes
  app.get('/api/admin/inquiries', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.json({ inquiries: db.inquiries });
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const inquiry = db.inquiries.find((item) => item.id === req.params.id);
    if (!inquiry) {
      res.status(404).json({ error: 'Заявка не найдена.' });
      return;
    }
    const allowedStatuses = ['Новая', 'В работе', 'Завершена'] as const;
    if (allowedStatuses.includes(req.body?.status)) {
      inquiry.status = req.body.status;
      saveDatabase(db);
    }
    res.json({ inquiry });
  });

  app.put('/api/admin/studio', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const incoming = req.body as Partial<StudioProfile>;
    const nextStudio: StudioProfile = {
      brandName: sanitizeText(incoming.brandName, 60) || db.studio.brandName,
      founderName: sanitizeText(incoming.founderName, 80) || db.studio.founderName,
      founderRole: sanitizeText(incoming.founderRole, 160) || db.studio.founderRole,
      city: sanitizeText(incoming.city, 80) || db.studio.city,
      portraitUrl:
        typeof incoming.portraitUrl === 'string' && isSafeHttpUrl(incoming.portraitUrl)
          ? incoming.portraitUrl.trim()
          : db.studio.portraitUrl,
      aboutLead: sanitizeText(incoming.aboutLead, 400) || db.studio.aboutLead,
      aboutStory:
        Array.isArray(incoming.aboutStory) && incoming.aboutStory.length > 0
          ? sanitizeStringArray(incoming.aboutStory, 8, 1200)
          : db.studio.aboutStory,
      aboutValues:
        Array.isArray(incoming.aboutValues) && incoming.aboutValues.length > 0
          ? sanitizeStringArray(incoming.aboutValues, 10, 300)
          : db.studio.aboutValues,
      pageRateKgs:
        Number.isFinite(Number(incoming.pageRateKgs)) && Number(incoming.pageRateKgs) >= 1000
          ? Math.round(Number(incoming.pageRateKgs))
          : db.studio.pageRateKgs,
      contacts: {
        whatsappNumber:
          sanitizeText(incoming.contacts?.whatsappNumber, 30).replace(/\D/g, '') ||
          db.studio.contacts.whatsappNumber,
        whatsappDisplay:
          sanitizeText(incoming.contacts?.whatsappDisplay, 40) ||
          db.studio.contacts.whatsappDisplay,
        telegramUrl:
          incoming.contacts?.telegramUrl && isSafeHttpUrl(incoming.contacts.telegramUrl)
            ? incoming.contacts.telegramUrl.trim()
            : db.studio.contacts.telegramUrl,
        telegramDisplay:
          sanitizeText(incoming.contacts?.telegramDisplay, 60) ||
          db.studio.contacts.telegramDisplay,
        instagramUrl:
          incoming.contacts?.instagramUrl && isSafeHttpUrl(incoming.contacts.instagramUrl)
            ? incoming.contacts.instagramUrl.trim()
            : db.studio.contacts.instagramUrl,
        instagramDisplay:
          sanitizeText(incoming.contacts?.instagramDisplay, 60) ||
          db.studio.contacts.instagramDisplay,
        email: sanitizeText(incoming.contacts?.email, 120) || db.studio.contacts.email,
      },
    };

    db.studio = nextStudio;
    saveDatabase(db);
    res.json({ studio: db.studio });
  });

  app.post('/api/admin/projects', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const body = req.body as Partial<ProjectCase>;
    const title = sanitizeText(body.title, 120);
    if (title.length < 2) {
      res.status(400).json({ error: 'Укажите название проекта.' });
      return;
    }

    const category = body.category === 'single-page' ? 'single-page' : 'multi-page';
    const status =
      body.status === 'В развитии' || body.status === 'Концепт'
        ? body.status
        : 'Запущен';

    const imageUrl =
      typeof body.imageUrl === 'string' && isSafeHttpUrl(body.imageUrl)
        ? body.imageUrl.trim()
        : '/src/assets/images/nestro_hero_glass_showcase_1795371335595.jpg';

    const liveUrl =
      typeof body.liveUrl === 'string' && isSafeHttpUrl(body.liveUrl)
        ? body.liveUrl.trim()
        : '';

    const newProject: ProjectCase = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      slug:
        sanitizeText(body.slug, 80) ||
        `project-${Date.now().toString(36)}`,
      title,
      category,
      categoryLabel:
        category === 'single-page' ? 'Одностраничный сайт' : 'Многостраничный сайт',
      status,
      year: sanitizeText(body.year, 10) || String(new Date().getFullYear()),
      imageUrl,
      liveUrl,
      shortDescription:
        sanitizeText(body.shortDescription, 500) ||
        'Индивидуальная разработка сайта под задачи бизнеса.',
      problemSolved:
        sanitizeText(body.problemSolved, 600) ||
        'Понятная презентация услуг и автоматический сбор заявок.',
      implementedSummary:
        sanitizeText(body.implementedSummary, 600) ||
        'Адаптивный интерфейс, структура страниц и форма обратной связи.',
      technologies: sanitizeStringArray(body.technologies, 12, 50),
      caseStudy: {
        taskDescription:
          sanitizeText(body.caseStudy?.taskDescription, 800) ||
          sanitizeText(body.shortDescription, 500),
        clientProblem:
          sanitizeText(body.caseStudy?.clientProblem, 800) ||
          sanitizeText(body.problemSolved, 600),
        proposedSolution:
          sanitizeText(body.caseStudy?.proposedSolution, 800) ||
          sanitizeText(body.implementedSummary, 600),
        implementationStages: sanitizeStringArray(
          body.caseStudy?.implementationStages,
          8,
          200,
        ),
        keyFeatures: sanitizeStringArray(body.caseStudy?.keyFeatures, 10, 200),
        desktopNotes:
          sanitizeText(body.caseStudy?.desktopNotes, 400) ||
          'Продуманная сетка и типографика для широких экранов.',
        mobileNotes:
          sanitizeText(body.caseStudy?.mobileNotes, 400) ||
          'Удобная мобильная версия и быстрый доступ к целевым действиям.',
        result:
          sanitizeText(body.caseStudy?.result, 600) ||
          'Проект подготовлен и опубликован.',
      },
    };

    db.projects.unshift(newProject);
    saveDatabase(db);
    res.status(201).json({ project: newProject });
  });

  app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const index = db.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Проект не найден.' });
      return;
    }

    const existing = db.projects[index];
    const body = req.body as Partial<ProjectCase>;
    const category =
      body.category === 'single-page' || body.category === 'multi-page'
        ? body.category
        : existing.category;

    const updated: ProjectCase = {
      ...existing,
      title: sanitizeText(body.title, 120) || existing.title,
      category,
      categoryLabel:
        category === 'single-page' ? 'Одностраничный сайт' : 'Многостраничный сайт',
      status:
        body.status === 'Запущен' ||
        body.status === 'В развитии' ||
        body.status === 'Концепт'
          ? body.status
          : existing.status,
      year: sanitizeText(body.year, 10) || existing.year,
      imageUrl:
        typeof body.imageUrl === 'string' && isSafeHttpUrl(body.imageUrl)
          ? body.imageUrl.trim()
          : existing.imageUrl,
      liveUrl:
        typeof body.liveUrl === 'string' &&
        (body.liveUrl === '' || isSafeHttpUrl(body.liveUrl))
          ? body.liveUrl.trim()
          : existing.liveUrl,
      shortDescription:
        sanitizeText(body.shortDescription, 500) || existing.shortDescription,
      problemSolved: sanitizeText(body.problemSolved, 600) || existing.problemSolved,
      implementedSummary:
        sanitizeText(body.implementedSummary, 600) || existing.implementedSummary,
      technologies:
        Array.isArray(body.technologies)
          ? sanitizeStringArray(body.technologies, 12, 50)
          : existing.technologies,
      caseStudy: {
        taskDescription:
          sanitizeText(body.caseStudy?.taskDescription, 800) ||
          existing.caseStudy.taskDescription,
        clientProblem:
          sanitizeText(body.caseStudy?.clientProblem, 800) ||
          existing.caseStudy.clientProblem,
        proposedSolution:
          sanitizeText(body.caseStudy?.proposedSolution, 800) ||
          existing.caseStudy.proposedSolution,
        implementationStages: Array.isArray(body.caseStudy?.implementationStages)
          ? sanitizeStringArray(body.caseStudy?.implementationStages, 8, 200)
          : existing.caseStudy.implementationStages,
        keyFeatures: Array.isArray(body.caseStudy?.keyFeatures)
          ? sanitizeStringArray(body.caseStudy?.keyFeatures, 10, 200)
          : existing.caseStudy.keyFeatures,
        desktopNotes:
          sanitizeText(body.caseStudy?.desktopNotes, 400) ||
          existing.caseStudy.desktopNotes,
        mobileNotes:
          sanitizeText(body.caseStudy?.mobileNotes, 400) ||
          existing.caseStudy.mobileNotes,
        result: sanitizeText(body.caseStudy?.result, 600) || existing.caseStudy.result,
      },
    };

    db.projects[index] = updated;
    saveDatabase(db);
    res.json({ project: updated });
  });

  app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const initialLength = db.projects.length;
    db.projects = db.projects.filter((p) => p.id !== req.params.id);
    if (db.projects.length === initialLength) {
      res.status(404).json({ error: 'Проект не найден.' });
      return;
    }
    saveDatabase(db);
    res.json({ deletedId: req.params.id });
  });

  app.put('/api/admin/services', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const incoming = req.body?.services;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ error: 'Ожидается массив услуг.' });
      return;
    }
    const validFormats: SiteFormatId[] = [
      'single-page',
      'multi-page',
      'catalog',
      'booking',
      'custom',
    ];
    const nextServices: ServiceItem[] = incoming
      .slice(0, 12)
      .map((item: Partial<ServiceItem>, idx: number) => ({
        id: sanitizeText(item.id, 60) || `srv-${idx + 1}`,
        number: String(idx + 1).padStart(2, '0'),
        formatId: validFormats.includes(item.formatId as SiteFormatId)
          ? (item.formatId as SiteFormatId)
          : 'multi-page',
        title: sanitizeText(item.title, 120) || 'Услуга студии',
        description: sanitizeText(item.description, 500),
        solves: sanitizeText(item.solves, 500),
        features: sanitizeStringArray(item.features, 8, 220),
      }));

    db.services = nextServices;
    saveDatabase(db);
    res.json({ services: db.services });
  });

  app.put('/api/admin/faq', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const incoming = req.body?.faq;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ error: 'Ожидается массив вопросов и ответов.' });
      return;
    }
    const nextFaq: FaqItem[] = incoming
      .slice(0, 30)
      .map((item: Partial<FaqItem>, idx: number) => ({
        id: sanitizeText(item.id, 60) || `faq-${idx + 1}`,
        question: sanitizeText(item.question, 240),
        answer: sanitizeText(item.answer, 1200),
      }))
      .filter((item) => item.question.length >= 3 && item.answer.length >= 3);

    db.faq = nextFaq;
    saveDatabase(db);
    res.json({ faq: db.faq });
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl,
    );
    if (!match) {
      res.status(400).json({
        error: 'Поддерживаются только изображения PNG, JPEG или WebP.',
      });
      return;
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > 3 * 1024 * 1024) {
      res.status(400).json({ error: 'Размер файла не должен превышать 3 МБ.' });
      return;
    }

    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `upload-${crypto.randomUUID()}.${ext}`;
    const resolvedPath = path.resolve(UPLOAD_DIR, fileName);
    if (!resolvedPath.startsWith(UPLOAD_DIR + path.sep)) {
      res.status(400).json({ error: 'Недопустимый путь файла.' });
      return;
    }

    fs.writeFileSync(resolvedPath, buffer);
    res.status(201).json({ url: `/uploads/${fileName}` });
  });

  // Vite dev middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NESTRO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NESTRO server:', err);
  process.exit(1);
});

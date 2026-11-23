import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Lock, Plus, Trash2, Upload, X } from 'lucide-react';
import type {
  FaqItem,
  InquiryRecord,
  ProjectCase,
  ProjectCategory,
  ProjectStatus,
  ServiceItem,
  StudioDatabaseContent,
  StudioProfile,
} from '../types/studio.ts';
import { formatKgs } from '../utils/studioLogic.ts';

interface AdminModalProps {
  open: boolean;
  content: StudioDatabaseContent;
  onClose: () => void;
  onContentUpdated: (next: StudioDatabaseContent) => void;
}

type AdminTab = 'inquiries' | 'projects' | 'services' | 'studio' | 'faq';

export function AdminModal({
  open,
  content,
  onClose,
  onContentUpdated,
}: AdminModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('inquiries');
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable drafts
  const [studioDraft, setStudioDraft] = useState<StudioProfile>(content.studio);
  const [servicesDraft, setServicesDraft] = useState<ServiceItem[]>(content.services);
  const [faqDraft, setFaqDraft] = useState<FaqItem[]>(content.faq);

  // New project form state
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjCategory, setNewProjCategory] =
    useState<ProjectCategory>('single-page');
  const [newProjStatus, setNewProjStatus] = useState<ProjectStatus>('Запущен');
  const [newProjUrl, setNewProjUrl] = useState('');
  const [newProjImage, setNewProjImage] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjProblem, setNewProjProblem] = useState('');
  const [newProjTech, setNewProjTech] = useState('React, JavaScript, REST API');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setStudioDraft(content.studio);
    setServicesDraft(content.services);
    setFaqDraft(content.faq);
  }, [content]);

  useEffect(() => {
    if (!open) return;
    setAuthError(null);
    setSaveMessage(null);
    setSaveError(null);
    setStatusLoading(true);
    fetch('/api/admin/status', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        setNeedsSetup(Boolean(data.needsSetup));
        if (data.authenticated && token) {
          return loadInquiries(token);
        }
      })
      .catch(() => {
        setAuthError('Не удалось проверить статус панели управления.');
      })
      .finally(() => setStatusLoading(false));
  }, [open, token]);

  const loadInquiries = async (authToken: string) => {
    const res = await fetch('/api/admin/inquiries', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setInquiries(data.inquiries || []);
    }
  };

  const handleSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.length < 6) {
      setAuthError('Пароль должен содержать минимум 6 символов.');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setAuthError('Введите корректный email администратора.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Пароли не совпадают.');
      return;
    }
    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Не удалось сохранить пароль.');
      return;
    }
    setToken(data.token);
    setNeedsSetup(false);
    setEmailInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    await loadInquiries(data.token);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setAuthError('Введите email администратора.');
      return;
    }
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Ошибка входа.');
      return;
    }
    setToken(data.token);
    setEmailInput('');
    setPasswordInput('');
    await loadInquiries(data.token);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingImage(true);
    setSaveError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Не удалось загрузить изображение.');
        return;
      }
      setNewProjImage(data.url);
      setSaveMessage('Скриншот загружен.');
    } catch {
      setSaveError('Ошибка загрузки изображения.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveMessage(null);
    setSaveError(null);

    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newProjTitle,
        category: newProjCategory,
        status: newProjStatus,
        liveUrl: newProjUrl,
        imageUrl:
          newProjImage ||
          '/src/assets/images/nestro_hero_glass_showcase_1795371335595.jpg',
        shortDescription: newProjDesc,
        problemSolved: newProjProblem,
        technologies: newProjTech
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || 'Не удалось добавить проект.');
      return;
    }

    onContentUpdated({
      ...content,
      projects: [data.project as ProjectCase, ...content.projects],
    });
    setNewProjTitle('');
    setNewProjUrl('');
    setNewProjImage('');
    setNewProjDesc('');
    setNewProjProblem('');
    setSaveMessage('Проект добавлен и опубликован на сайте.');
  };

  const handleDeleteProject = async (id: string) => {
    if (!token) return;
    setSaveError(null);
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setSaveError('Не удалось удалить проект.');
      return;
    }
    onContentUpdated({
      ...content,
      projects: content.projects.filter((p) => p.id !== id),
    });
    setSaveMessage('Проект удалён.');
  };

  const handleSaveStudio = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveMessage(null);
    setSaveError(null);

    const res = await fetch('/api/admin/studio', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(studioDraft),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || 'Не удалось сохранить данные студии.');
      return;
    }
    onContentUpdated({ ...content, studio: data.studio });
    setSaveMessage('Данные о студии и контакты обновлены.');
  };

  const handleSaveServices = async () => {
    if (!token) return;
    setSaveMessage(null);
    setSaveError(null);

    const res = await fetch('/api/admin/services', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ services: servicesDraft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || 'Не удалось сохранить услуги.');
      return;
    }
    onContentUpdated({ ...content, services: data.services });
    setSaveMessage('Список услуг обновлён.');
  };

  const handleSaveFaq = async () => {
    if (!token) return;
    setSaveMessage(null);
    setSaveError(null);

    const res = await fetch('/api/admin/faq', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ faq: faqDraft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || 'Не удалось сохранить FAQ.');
      return;
    }
    onContentUpdated({ ...content, faq: data.faq });
    setSaveMessage('Раздел вопросов и ответов обновлён.');
  };

  const handleInquiryStatusChange = async (
    id: string,
    status: InquiryRecord['status'],
  ) => {
    if (!token) return;
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171919]/45 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[960px] max-h-[92vh] overflow-y-auto glass-surface-strong rounded-3xl p-5 sm:p-8 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E8EBEB]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#252B29]" />
            <h2
              id="admin-modal-title"
              className="font-display text-xl sm:text-2xl font-semibold text-[#171919]"
            >
              Управление контентом NESTRO
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель управления"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#D1D5D5] bg-white text-[#171919] hover:bg-[#F7F8F8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusLoading ? (
          <div className="py-12 text-center text-sm text-[#777D7D]">
            Проверяем доступ...
          </div>
        ) : !token ? (
          <div className="max-w-md mx-auto py-8">
            {needsSetup ? (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#171919]">
                    Первичная настройка пароля администратора
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#777D7D]">
                    Создайте надёжный пароль для управления проектами, услугами,
                    контактами и просмотра входящих заявок. После настройки форма
                    создания пароля будет заблокирована.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-setup-email"
                    className="block text-sm font-medium text-[#171919] mb-1.5"
                  >
                    Email администратора
                  </label>
                  <input
                    id="admin-setup-email"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-setup-pass"
                    className="block text-sm font-medium text-[#171919] mb-1.5"
                  >
                    Новый пароль (от 6 символов)
                  </label>
                  <input
                    id="admin-setup-pass"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoComplete="new-password"
                    className="w-full min-h-12 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-setup-confirm"
                    className="block text-sm font-medium text-[#171919] mb-1.5"
                  >
                    Повторите пароль
                  </label>
                  <input
                    id="admin-setup-confirm"
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    autoComplete="new-password"
                    className="w-full min-h-12 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-base"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-700" role="alert">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#252B29] py-3 text-sm font-semibold text-white hover:bg-[#171919] cursor-pointer"
                >
                  Создать пароль и войти
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#171919]">
                    Вход в панель управления
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#777D7D]">
                    Введите email и пароль администратора.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-login-email"
                    className="block text-sm font-medium text-[#171919] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="admin-login-email"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-login-pass"
                    className="block text-sm font-medium text-[#171919] mb-1.5"
                  >
                    Пароль
                  </label>
                  <input
                    id="admin-login-pass"
                    type="password"
                    autoComplete="current-password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full min-h-12 rounded-xl border border-[#D1D5D5] bg-white px-3.5 py-3 text-base"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-700" role="alert">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#252B29] py-3 text-sm font-semibold text-white hover:bg-[#171919] cursor-pointer"
                >
                  Войти
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-6">
            {/* Admin tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8EBEB]">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['inquiries', `Заявки (${inquiries.length})`],
                    ['projects', `Проекты (${content.projects.length})`],
                    ['services', 'Услуги'],
                    ['studio', 'Обо мне и Контакты'],
                    ['faq', 'FAQ'],
                  ] as const
                ).map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => {
                      setActiveTab(tabId);
                      setSaveMessage(null);
                      setSaveError(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      activeTab === tabId
                        ? 'bg-[#252B29] text-white'
                        : 'bg-[#F7F8F8] text-[#777D7D] hover:text-[#171919]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setToken(null)}
                className="text-xs font-medium text-[#777D7D] hover:text-[#171919] cursor-pointer"
              >
                Выйти
              </button>
            </div>

            {saveMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900">
                {saveMessage}
              </div>
            )}
            {saveError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-900">
                {saveError}
              </div>
            )}

            {/* Tab: Inquiries */}
            {activeTab === 'inquiries' && (
              <div className="mt-5 space-y-3">
                {inquiries.length === 0 ? (
                  <div className="rounded-2xl border border-[#E8EBEB] bg-white/70 p-8 text-center text-sm text-[#777D7D]">
                    Входящих заявок пока нет. Они появятся здесь сразу после отправки формы на сайте.
                  </div>
                ) : (
                  inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="rounded-2xl border border-[#E8EBEB] bg-white p-4 sm:p-5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-[#171919]">
                          {inq.name} {inq.company ? `(${inq.company})` : ''} —{' '}
                          <span className="font-mono-num">{formatKgs(inq.estimatedKgs)}</span>
                        </div>
                        <select
                          aria-label={`Статус заявки ${inq.name}`}
                          value={inq.status}
                          onChange={(e) =>
                            handleInquiryStatusChange(
                              inq.id,
                              e.target.value as InquiryRecord['status'],
                            )
                          }
                          className="rounded-lg border border-[#D1D5D5] bg-[#F7F8F8] px-2.5 py-1 text-xs"
                        >
                          <option value="Новая">Новая</option>
                          <option value="В работе">В работе</option>
                          <option value="Завершена">Завершена</option>
                        </select>
                      </div>
                      <div className="text-xs text-[#777D7D]">
                        {inq.businessSphere} · {inq.contact} · {inq.pagesCount} стр.
                      </div>
                      <p className="text-xs sm:text-sm text-[#171919]">
                        {inq.taskDescription}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Projects */}
            {activeTab === 'projects' && (
              <div className="mt-5 space-y-6">
                <form
                  onSubmit={handleAddProject}
                  className="rounded-2xl border border-[#E8EBEB] bg-white p-5 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-[#171919]">
                    Добавить новый проект
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newProjTitle}
                      onChange={(e) => setNewProjTitle(e.target.value)}
                      placeholder="Название проекта *"
                      className="rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                      required
                    />
                    <select
                      value={newProjCategory}
                      onChange={(e) =>
                        setNewProjCategory(e.target.value as ProjectCategory)
                      }
                      className="rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                    >
                      <option value="single-page">Одностраничный сайт</option>
                      <option value="multi-page">Многостраничный сайт</option>
                    </select>
                    <select
                      value={newProjStatus}
                      onChange={(e) =>
                        setNewProjStatus(e.target.value as ProjectStatus)
                      }
                      className="rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                    >
                      <option value="Запущен">Запущен</option>
                      <option value="В развитии">В развитии</option>
                      <option value="Концепт">Концепт</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={newProjUrl}
                      onChange={(e) => setNewProjUrl(e.target.value)}
                      placeholder="Ссылка на сайт (https://...)"
                      className="rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newProjImage}
                        onChange={(e) => setNewProjImage(e.target.value)}
                        placeholder="URL скриншота или загрузите файл"
                        className="flex-1 rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                      />
                      <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5D5] bg-[#F7F8F8] px-3 py-2 text-xs font-medium cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? '...' : 'Фото'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Краткое описание проекта"
                    className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newProjProblem}
                    onChange={(e) => setNewProjProblem(e.target.value)}
                    placeholder="Какую задачу решает проект"
                    className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    placeholder="Технологии через запятую"
                    className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#252B29] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#171919] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить проект</span>
                  </button>
                </form>

                <div className="space-y-2.5">
                  {content.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8EBEB] bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#171919]">
                          {proj.title}
                        </div>
                        <div className="text-xs text-[#777D7D]">
                          {proj.categoryLabel} · {proj.status} · {proj.liveUrl || 'без ссылки'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        aria-label={`Удалить проект ${proj.title}`}
                        className="p-2 rounded-lg text-[#777D7D] hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Services */}
            {activeTab === 'services' && (
              <div className="mt-5 space-y-4">
                {servicesDraft.map((srv, idx) => (
                  <div
                    key={srv.id}
                    className="rounded-2xl border border-[#E8EBEB] bg-white p-4 space-y-2.5"
                  >
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) => {
                        const next = [...servicesDraft];
                        next[idx] = { ...srv, title: e.target.value };
                        setServicesDraft(next);
                      }}
                      className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-sm font-semibold"
                    />
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => {
                        const next = [...servicesDraft];
                        next[idx] = { ...srv, description: e.target.value };
                        setServicesDraft(next);
                      }}
                      className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={srv.solves}
                      onChange={(e) => {
                        const next = [...servicesDraft];
                        next[idx] = { ...srv, solves: e.target.value };
                        setServicesDraft(next);
                      }}
                      className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSaveServices}
                  className="rounded-xl bg-[#252B29] px-5 py-3 text-xs font-semibold text-white hover:bg-[#171919] cursor-pointer"
                >
                  Сохранить изменения услуг
                </button>
              </div>
            )}

            {/* Tab: Studio & Contacts */}
            {activeTab === 'studio' && (
              <form onSubmit={handleSaveStudio} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Имя основателя
                    </label>
                    <input
                      type="text"
                      value={studioDraft.founderName}
                      onChange={(e) =>
                        setStudioDraft({ ...studioDraft, founderName: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Базовая ставка за страницу (сом)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={studioDraft.pageRateKgs}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          pageRateKgs: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm font-mono-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Главный тезис «Обо мне»
                  </label>
                  <textarea
                    rows={2}
                    value={studioDraft.aboutLead}
                    onChange={(e) =>
                      setStudioDraft({ ...studioDraft, aboutLead: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Номер WhatsApp (цифры, например 996555000000)
                    </label>
                    <input
                      type="text"
                      value={studioDraft.contacts.whatsappNumber}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          contacts: {
                            ...studioDraft.contacts,
                            whatsappNumber: e.target.value,
                            whatsappDisplay: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Telegram (@username)
                    </label>
                    <input
                      type="text"
                      value={studioDraft.contacts.telegramDisplay}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          contacts: {
                            ...studioDraft.contacts,
                            telegramDisplay: e.target.value,
                            telegramUrl: `https://t.me/${e.target.value.replace(/^@/, '')}`,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Instagram (@handle)
                    </label>
                    <input
                      type="text"
                      value={studioDraft.contacts.instagramDisplay}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          contacts: {
                            ...studioDraft.contacts,
                            instagramDisplay: e.target.value,
                            instagramUrl: `https://instagram.com/${e.target.value.replace(/^@/, '')}`,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={studioDraft.contacts.email}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          contacts: { ...studioDraft.contacts, email: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#D1D5D5] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#252B29] px-5 py-3 text-xs font-semibold text-white hover:bg-[#171919] cursor-pointer"
                >
                  Сохранить информацию о студии
                </button>
              </form>
            )}

            {/* Tab: FAQ */}
            {activeTab === 'faq' && (
              <div className="mt-5 space-y-4">
                {faqDraft.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#E8EBEB] bg-white p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const next = [...faqDraft];
                          next[idx] = { ...item, question: e.target.value };
                          setFaqDraft(next);
                        }}
                        className="flex-1 rounded-xl border border-[#D1D5D5] px-3 py-2 text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFaqDraft(faqDraft.filter((f) => f.id !== item.id))
                        }
                        aria-label={`Удалить вопрос ${item.question}`}
                        className="p-2 rounded-lg text-[#777D7D] hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => {
                        const next = [...faqDraft];
                        next[idx] = { ...item, answer: e.target.value };
                        setFaqDraft(next);
                      }}
                      className="w-full rounded-xl border border-[#D1D5D5] px-3 py-2 text-xs sm:text-sm"
                    />
                  </div>
                ))}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFaqDraft([
                        ...faqDraft,
                        {
                          id: `faq-${Date.now()}`,
                          question: 'Новый вопрос',
                          answer: 'Подробный ответ',
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5D5] bg-white px-4 py-2.5 text-xs font-semibold text-[#171919] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить вопрос</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveFaq}
                    className="rounded-xl bg-[#252B29] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#171919] cursor-pointer"
                  >
                    Сохранить FAQ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

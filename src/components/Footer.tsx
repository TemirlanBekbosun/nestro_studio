import type { StudioProfile } from '../types/studio.ts';
import { isSafeHttpUrl } from '../utils/studioLogic.ts';
import { NestroLogoMark } from './NestroMark.tsx';

interface FooterProps {
  studio: StudioProfile;
  onOpenAdmin: () => void;
}

export function Footer({ studio, onOpenAdmin }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E8EBEB] bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <a
              href="#top"
              className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#171919]"
            >
              <NestroLogoMark className="w-7 h-7" />
              <span>{studio.brandName}</span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-[#777D7D] max-w-[42ch]">
              Создаём современные сайты, онлайн-запись, каталоги и системы 24/7
              CRM-автоматизации, которые превращают идеи бизнеса в рабочие
              цифровые решения.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold text-[#171919]">Разделы</div>
            <ul className="mt-3 space-y-2 text-sm text-[#777D7D]">
              <li>
                <a href="#about" className="hover:text-[#171919] transition-colors">
                  О студии
                </a>
              </li>
              <li>
                <a href="#projects" className="hover:text-[#171919] transition-colors">
                  Проекты
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#171919] transition-colors">
                  Услуги
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-[#171919] transition-colors">
                  Процесс работы
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#171919] transition-colors">
                  Частые вопросы
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="text-xs font-semibold text-[#171919]">
              Контакты и мессенджеры
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#777D7D]">
              <li>
                <a
                  href={`https://wa.me/${studio.contacts.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#171919] transition-colors"
                >
                  WhatsApp: {studio.contacts.whatsappDisplay}
                </a>
              </li>
              {isSafeHttpUrl(studio.contacts.telegramUrl) && (
                <li>
                  <a
                    href={studio.contacts.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#171919] transition-colors"
                  >
                    Telegram: {studio.contacts.telegramDisplay}
                  </a>
                </li>
              )}
              {isSafeHttpUrl(studio.contacts.instagramUrl) && (
                <li>
                  <a
                    href={studio.contacts.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#171919] transition-colors"
                  >
                    Instagram: {studio.contacts.instagramDisplay}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${studio.contacts.email}`}
                  className="hover:text-[#171919] transition-colors"
                >
                  {studio.contacts.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E8EBEB] flex flex-wrap items-center justify-between gap-4 text-xs text-[#777D7D]">
          <span>
            © {year} {studio.brandName}. Все права защищены.
          </span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="text-xs font-medium text-[#777D7D] hover:text-[#171919] transition-colors cursor-pointer"
          >
            Управление контентом
          </button>
        </div>
      </div>
    </footer>
  );
}

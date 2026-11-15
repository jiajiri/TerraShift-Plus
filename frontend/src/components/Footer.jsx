import React from 'react';
import { FileText, Info, Code } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Footer({ onOpenAbout }) {
  const { lang, t } = useI18n();

  return (
    <footer className="mt-12 bg-white border-t border-[#DDD9CE] py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs font-mono text-[#767E78] gap-4">
        <div className="flex flex-wrap items-center space-x-2">
          <span className="font-semibold text-[#1C231F]">{t('footer.brand')}</span>
          <span>|</span>
          <span>{t('footer.challenge')}</span>
          <span>|</span>
          <span>{t('footer.track')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="hover:text-[#234E36] transition-colors flex items-center gap-1 font-semibold text-[#1F5673]"
            >
              <Info size={13} />
              <span>{t('navbar.about_us')}</span>
            </button>
          )}

          <a
            href="/docs.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Interactive OpenAPI 3.1 Swagger UI Documentation"
            className="hover:text-[#234E36] transition-colors flex items-center gap-1 font-semibold text-[#1F5673]"
          >
            <Code size={13} />
            <span>{lang === 'sw' ? 'Nyaraka za API (Swagger)' : 'API Docs (Swagger)'}</span>
          </a>

          <a
            href="/research-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#234E36] transition-colors flex items-center gap-1 font-semibold text-[#1F5673]"
          >
            <FileText size={13} />
            <span>{t('footer.paper')}</span>
          </a>

          <div className="hidden sm:flex items-center gap-3 text-[#A0A69F] border-l border-[#DDD9CE] pl-4">
            <span>NASA POWER</span>
            <span>SMAP</span>
            <span>GPM</span>
            <span>MODIS</span>
            <span>SOILGRIDS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

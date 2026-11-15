import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Database,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Globe,
  MapPin,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function AboutModal({ isOpen, onClose }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const teamMembers = t('about.team_members') || [];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#FFFFFF] border border-[#DDD9CE] shadow-2xl rounded-xs flex flex-col overflow-hidden text-[#1C231F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F5F0] border-b border-[#DDD9CE] shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-[#234E36] text-white text-[10px] font-mono uppercase tracking-wider rounded-xs font-semibold">
              {t('about.badge')}
            </span>
            <h2 id="about-modal-title" className="text-sm sm:text-base font-semibold font-mono tracking-tight text-[#1C231F]">
              {t('about.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#767E78] hover:text-[#1C231F] hover:bg-[#DDD9CE]/40 rounded-xs transition-colors"
            title={t('about.close')}
            aria-label={t('about.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed bg-[#FFFFFF]">
          {/* Subtitle / Collaboration Banner */}
          <div className="p-3.5 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs flex items-start space-x-3">
            <Globe className="w-5 h-5 text-[#234E36] shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs font-semibold text-[#234E36]">
                {t('about.subtitle')}
              </p>
            </div>
          </div>

          {/* Project Mission */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#767E78]">
              <Sparkles className="w-3.5 h-3.5 text-[#234E36]" />
              <span>{t('about.mission_title')}</span>
            </div>
            <p className="text-[#323B36] font-sans text-xs sm:text-[13px] leading-relaxed">
              {t('about.mission_desc')}
            </p>
          </div>

          {/* Team & Regional Collaboration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#767E78]">
                <Award className="w-3.5 h-3.5 text-[#234E36]" />
                <span>{t('about.team_title')}</span>
              </div>
              <span className="text-[10px] font-mono text-[#767E78]">
                {t('about.team_subtitle')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.isArray(teamMembers) &&
                teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-xs text-[#1C231F]">
                          {member.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white border border-[#DDD9CE] text-[#234E36] rounded-xs font-medium">
                          {member.country}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4E5851] mt-1.5 leading-snug">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* NASA & Satellite Data Stack */}
          <div className="p-4 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#767E78]">
              <Database className="w-3.5 h-3.5 text-[#1F5673]" />
              <span className="text-[#1F5673]">{t('about.data_stack_title')}</span>
            </div>
            <p className="text-[#323B36] font-sans text-xs leading-relaxed">
              {t('about.data_stack_desc')}
            </p>
          </div>

          {/* Physics-Informed Agronomic Engine (PIML) */}
          <div className="p-4 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#767E78]">
              <Layers className="w-3.5 h-3.5 text-[#234E36]" />
              <span className="text-[#234E36]">{t('about.methodology_title')}</span>
            </div>
            <p className="text-[#323B36] font-sans text-xs leading-relaxed">
              {t('about.methodology_desc')}
            </p>
          </div>

          {/* AI / Super Intelligence (SI) Disclosure */}
          
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#F6F5F0] border-t border-[#DDD9CE] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/research-paper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 bg-[#234E36] text-white text-xs font-mono font-medium hover:bg-[#1A3B29] transition-colors inline-flex items-center space-x-1.5 rounded-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('about.open_paper')}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>


          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 bg-white border border-[#DDD9CE] text-xs font-mono text-[#1C231F] hover:bg-[#E7E4DA] transition-colors rounded-xs ml-auto"
          >
            {t('about.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
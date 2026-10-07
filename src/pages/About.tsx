import React from 'react';
import { useI18n } from '../lib/i18n';
import { ExternalLink, Shield, Info } from 'lucide-react';

export function About() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('about.title')}</h1>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div className="bg-[#111] rounded-3xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <Info size={20} className="text-[#FF6B50] mt-0.5 shrink-0" />
            <div>
              <h2 className="text-white font-medium mb-2">Tracenime</h2>
              <p className="text-[#888] text-sm leading-relaxed">{t('about.description')}</p>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-[#111] rounded-3xl p-6">
          <h2 className="text-white font-medium mb-4">Credits</h2>
          <div className="space-y-3">
            <a
              href="https://trace.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] transition-colors group"
            >
              <div>
                <p className="text-white text-sm font-medium">trace.moe</p>
                <p className="text-[#666] text-xs">Anime scene search engine</p>
              </div>
              <ExternalLink size={14} className="text-[#666] group-hover:text-[#FF6B50] transition-colors" />
            </a>
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] transition-colors group"
            >
              <div>
                <p className="text-white text-sm font-medium">AniList</p>
                <p className="text-[#666] text-xs">Anime tracking and metadata</p>
              </div>
              <ExternalLink size={14} className="text-[#666] group-hover:text-[#FF6B50] transition-colors" />
            </a>
          </div>
          <p className="text-[#666] text-xs mt-4">{t('about.notAffiliated')}</p>
        </div>

        {/* Privacy */}
        <div className="bg-[#111] rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-green-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-white font-medium mb-2">Privacy</h2>
              <p className="text-[#888] text-sm leading-relaxed">{t('about.privacy')}</p>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-[#444] text-xs">Version 1.0</p>
          <p className="text-[#333] text-xs mt-1">Built with React, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

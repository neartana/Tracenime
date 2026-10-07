import React from 'react';
import { useI18n } from '../lib/i18n';
import { ExternalLink, Shield, Info } from 'lucide-react';

export function About() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// INFORMATION</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(3rem, 12vw, 12rem)' }}
          >
            ABOUT
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Description */}
          <div className="border-brutal-white p-6">
            <div className="flex items-start gap-4">
              <Info size={24} className="text-[#FF4D00] mt-1 shrink-0" />
              <div>
                <h2 className="font-display text-xl mb-4">TRACENIME</h2>
                <p className="font-mono-custom text-sm text-white/80 leading-relaxed">
                  {t('about.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="border-brutal-white p-6">
            <h2 className="font-display text-xl mb-6">CREDITS</h2>
            <div className="space-y-3">
              <a
                href="https://trace.moe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-brutal-white hover:bg-white hover:text-black transition-all group"
              >
                <div>
                  <p className="font-display text-sm">TRACE.MOE</p>
                  <p className="font-mono-custom text-[10px] text-white/60 group-hover:text-black/60">ANIME SCENE SEARCH ENGINE</p>
                </div>
                <ExternalLink size={16} className="text-white/60 group-hover:text-black" />
              </a>
              <a
                href="https://anilist.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-brutal-white hover:bg-white hover:text-black transition-all group"
              >
                <div>
                  <p className="font-display text-sm">ANILIST</p>
                  <p className="font-mono-custom text-[10px] text-white/60 group-hover:text-black/60">ANIME TRACKING AND METADATA</p>
                </div>
                <ExternalLink size={16} className="text-white/60 group-hover:text-black" />
              </a>
            </div>
            <p className="font-mono-custom text-[10px] text-white/40 mt-4">{t('about.notAffiliated')}</p>
          </div>

          {/* Privacy */}
          <div className="border-brutal-white p-6">
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-green-400 mt-1 shrink-0" />
              <div>
                <h2 className="font-display text-xl mb-4">PRIVACY</h2>
                <p className="font-mono-custom text-sm text-white/80 leading-relaxed">
                  {t('about.privacy')}
                </p>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="text-center pt-8 border-t border-white/20">
            <p className="font-mono-custom text-xs text-white/40">VERSION 1.0</p>
            <p className="font-mono-custom text-[10px] text-white/20 mt-1">
              BUILT WITH REACT + TYPESCRIPT + TAILWIND
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

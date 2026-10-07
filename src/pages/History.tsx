import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getRecentSearches, deleteSearch, clearAllSearches } from '../lib/db';
import type { SearchRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { Trash2, AlertCircle, ArrowUpRight } from 'lucide-react';

export function History() {
  const { t } = useI18n();
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getRecentSearches().then(setSearches);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteSearch(id);
    setSearches(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllSearches();
    setSearches([]);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// ARCHIVE</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
          >
            HISTORY
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {searches.length > 0 && (
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono-custom text-xs text-white/60">
                {searches.length} {t('misc.entries') || 'ENTRIES'}
              </span>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-brutal text-xs flex items-center gap-2 border-white text-white hover:bg-white hover:text-black"
              >
                <Trash2 size={12} />
                {t('history.deleteAll')}
              </button>
            </div>
          )}

          {showConfirm && (
            <div className="border-brutal-white bg-white/5 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="font-mono-custom text-xs text-white/80">{t('history.confirmDelete')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-brutal text-xs border-white text-white hover:bg-white hover:text-black"
                >
                  {t('misc.cancel')}
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn-brutal text-xs bg-[#FF4D00] border-[#FF4D00] text-black hover:bg-black hover:text-[#FF4D00]"
                >
                  {t('misc.delete')}
                </button>
              </div>
            </div>
          )}

          {searches.length === 0 ? (
            <div className="text-center py-24">
              <AlertCircle size={48} className="mx-auto text-white/20 mb-4" />
              <p className="font-mono-custom text-sm text-white/40">{t('history.empty')}</p>
            </div>
          ) : (
            <div>
              {searches.map((search, index) => (
                <div
                  key={search.id}
                  className="service-item group flex items-center gap-4 px-4"
                >
                  {/* Index */}
                  <span className="font-mono-custom text-[#FF4D00] text-sm font-bold w-8 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Thumbnail */}
                  {search.thumbnail && (
                    <div className="w-16 h-16 border-brutal-white bg-black overflow-hidden shrink-0">
                      <img src={search.thumbnail} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 service-title">
                    <h3 className="font-display text-lg md:text-xl truncate">
                      {search.top?.title.romaji || search.top?.title.english || 'UNKNOWN'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 font-mono-custom text-[10px] text-white/60">
                      <span>EP.{search.top?.episode ?? '—'}</span>
                      <span>{search.top ? formatTimeRange(search.top.from, search.top.to) : ''}</span>
                      <span className={
                        (search.top?.similarity ?? 0) >= 0.9 ? 'text-green-400' :
                        (search.top?.similarity ?? 0) >= 0.8 ? 'text-yellow-400' : 'text-red-400'
                      }>
                        {search.top ? `${Math.round(search.top.similarity * 100)}%` : ''}
                      </span>
                    </div>
                    <p className="font-mono-custom text-[10px] text-white/40 mt-1">
                      {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="p-2 border-brutal-white text-white/40 hover:text-[#FF4D00] hover:border-[#FF4D00] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="service-arrow">
                      <ArrowUpRight size={24} className="text-[#FF4D00]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

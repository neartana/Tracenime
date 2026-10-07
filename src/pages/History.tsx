import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getRecentSearches, deleteSearch, clearAllSearches } from '../lib/db';
import type { SearchRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { Trash2, AlertCircle } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('history.title')}</h1>
        </div>
        {searches.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            {t('history.deleteAll')}
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="bg-[#111] rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-[#888]">{t('history.confirmDelete')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-[#888] hover:text-white transition-colors"
            >
              {t('misc.cancel')}
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              {t('misc.delete')}
            </button>
          </div>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#666]">{t('history.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searches.map((search, index) => (
            <div
              key={search.id}
              className={`bg-[#111] hover:bg-[#161616] rounded-3xl p-4 transition-colors group ${
                index % 2 === 1 ? 'md:mt-8' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {search.thumbnail && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a1a] shrink-0 thumbnail-hover">
                    <img src={search.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">
                    {search.top?.title.romaji || search.top?.title.english || 'Unknown'}
                  </h3>
                  {search.top && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#888]">
                      <span>Ep. {search.top.episode ?? '—'}</span>
                      <span>{formatTimeRange(search.top.from, search.top.to)}</span>
                      <span className={`${
                        search.top.similarity >= 0.9 ? 'text-green-400' :
                        search.top.similarity >= 0.8 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(search.top.similarity * 100)}%
                      </span>
                    </div>
                  )}
                  <p className="text-[#666] text-xs mt-1">
                    {new Date(search.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(search.id)}
                  className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 text-[#888] hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getFavorites, removeFavorite } from '../lib/db';
import type { FavoriteRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { Heart, AlertCircle, ExternalLink, ArrowUpRight } from 'lucide-react';

export function Favorites() {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);

  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  const handleRemove = async (sceneKey: string) => {
    await removeFavorite(sceneKey);
    setFavorites(prev => prev.filter(f => f.sceneKey !== sceneKey));
  };

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// SAVED SCENES</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(3rem, 12vw, 12rem)' }}
          >
            FAVORITES
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {favorites.length > 0 && (
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono-custom text-xs text-white/60">
                {favorites.length} SCENES
              </span>
            </div>
          )}

          {favorites.length === 0 ? (
            <div className="text-center py-24">
              <Heart size={48} className="mx-auto text-white/20 mb-4" />
              <p className="font-mono-custom text-sm text-white/40">{t('favorites.empty')}</p>
            </div>
          ) : (
            <div>
              {favorites.map((fav, index) => {
                const title = fav.title.romaji || fav.title.english || fav.title.native || 'UNKNOWN';
                return (
                  <div key={fav.sceneKey} className="service-item group">
                    <div className="flex items-center gap-4 px-4">
                      {/* Index */}
                      <span className="font-mono-custom text-[#FF4D00] text-sm font-bold w-8 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Thumbnail */}
                      {fav.thumbnail && (
                        <div className="w-20 h-20 border-brutal-white bg-black overflow-hidden shrink-0">
                          <img src={fav.thumbnail} alt={title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 service-title">
                        <h3 className="font-display text-lg md:text-xl truncate">{title}</h3>
                        <div className="flex items-center gap-3 mt-1 font-mono-custom text-[10px] text-white/60">
                          <span>EP.{fav.episode ?? '—'}</span>
                          <span>{formatTimeRange(fav.from, fav.to)}</span>
                          <span className={
                            fav.similarity >= 0.9 ? 'text-green-400' :
                            fav.similarity >= 0.8 ? 'text-yellow-400' : 'text-red-400'
                          }>
                            {Math.round(fav.similarity * 100)}%
                          </span>
                        </div>
                        <p className="font-mono-custom text-[10px] text-white/40 mt-1">
                          {new Date(fav.createdAt).toLocaleDateString()}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <a
                            href={`https://anilist.co/anime/${fav.anilistId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-brutal text-xs border-white text-white hover:bg-white hover:text-black py-1 px-3"
                          >
                            <ExternalLink size={12} className="inline mr-1" />
                            ANILIST
                          </a>
                          <button
                            onClick={() => handleRemove(fav.sceneKey)}
                            className="p-2 border-brutal-white text-[#FF4D00] hover:bg-[#FF4D00] hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Heart size={14} fill="currentColor" />
                          </button>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="service-arrow shrink-0">
                        <ArrowUpRight size={24} className="text-[#FF4D00]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

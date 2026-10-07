import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getFavorites, removeFavorite } from '../lib/db';
import type { FavoriteRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { Heart, AlertCircle, ExternalLink } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('favorites.title')}</h1>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#666]">{t('favorites.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((fav, index) => {
            const title = fav.title.romaji || fav.title.english || fav.title.native || 'Unknown';
            return (
              <div
                key={fav.sceneKey}
                className={`bg-[#111] hover:bg-[#161616] rounded-3xl p-5 transition-colors group ${
                  index % 2 === 1 ? 'md:mt-8' : ''
                }`}
              >
                <div className="flex gap-4">
                  {fav.thumbnail && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#1a1a1a] shrink-0">
                      <img src={fav.thumbnail} alt={title} className="w-full h-full object-cover thumbnail-hover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#888]">
                      <span>Ep. {fav.episode ?? '—'}</span>
                      <span>{formatTimeRange(fav.from, fav.to)}</span>
                      <span className={`${
                        fav.similarity >= 0.9 ? 'text-green-400' :
                        fav.similarity >= 0.8 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(fav.similarity * 100)}%
                      </span>
                    </div>
                    <p className="text-[#666] text-xs mt-1">
                      {new Date(fav.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={`https://anilist.co/anime/${fav.anilistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-white/10 text-[#888] hover:text-white transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => handleRemove(fav.sceneKey)}
                        className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 text-[#888] hover:text-red-400 transition-all"
                      >
                        <Heart size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

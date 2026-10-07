import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getRecentSearches, getLifetimeSearchCount, getAnimeCache } from '../lib/db';
import type { SearchRecord, AnimeCacheRecord } from '../lib/types';
import { BarChart3, TrendingUp, Hash } from 'lucide-react';

export function Statistics() {
  const { t } = useI18n();
  const [totalSearches, setTotalSearches] = useState(0);
  const [topAnime, setTopAnime] = useState<{ anilistId: number; title: string; count: number }[]>([]);
  const [topGenres, setTopGenres] = useState<{ genre: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const count = await getLifetimeSearchCount();
    setTotalSearches(count);

    const searches = await getRecentSearches(50);

    // Top anime
    const animeCounts: Record<number, { title: string; count: number }> = {};
    for (const s of searches) {
      if (s.topAnilistId) {
        const title = s.top?.title.romaji || s.top?.title.english || s.top?.title.native || 'Unknown';
        if (!animeCounts[s.topAnilistId]) {
          animeCounts[s.topAnilistId] = { title, count: 0 };
        }
        animeCounts[s.topAnilistId].count++;
      }
    }
    const topAnimeList = Object.entries(animeCounts)
      .map(([id, data]) => ({ anilistId: parseInt(id), ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopAnime(topAnimeList);

    // Top genres (from cached anime details)
    const genreCounts: Record<string, number> = {};
    for (const s of searches) {
      if (s.topAnilistId) {
        const cached = await getAnimeCache(s.topAnilistId);
        if (cached?.genres) {
          for (const genre of cached.genres) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        }
      }
    }
    const topGenresList = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopGenres(topGenresList);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('stats.title')}</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111] rounded-3xl p-5">
              <div className="skeleton h-5 w-1/3 rounded mb-4" />
              <div className="skeleton h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('stats.title')}</h1>
      </div>

      {totalSearches === 0 ? (
        <div className="text-center py-16">
          <BarChart3 size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#666]">{t('stats.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Searches */}
          <div className="bg-[#111] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Hash size={18} className="text-[#FF6B50]" />
              <h2 className="text-white font-medium">{t('stats.totalSearches')}</h2>
            </div>
            <p className="text-4xl font-bold text-white">{totalSearches}</p>
          </div>

          {/* Top Anime */}
          {topAnime.length > 0 && (
            <div className="bg-[#111] rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-[#FF6B50]" />
                <h2 className="text-white font-medium">{t('stats.topAnime')}</h2>
              </div>
              <div className="space-y-3">
                {topAnime.map((anime, i) => (
                  <div key={anime.anilistId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[#666] text-sm w-6">{i + 1}.</span>
                      <a
                        href={`https://anilist.co/anime/${anime.anilistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-sm truncate hover:text-[#FF6B50] transition-colors"
                      >
                        {anime.title}
                      </a>
                    </div>
                    <span className="text-[#888] text-sm shrink-0 ml-2">{anime.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Genres */}
          {topGenres.length > 0 && (
            <div className="bg-[#111] rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 size={18} className="text-[#FF6B50]" />
                <h2 className="text-white font-medium">{t('stats.topGenres')}</h2>
              </div>
              <p className="text-[#666] text-xs mb-4">Based on anime with loaded AniList details.</p>
              <div className="flex flex-wrap gap-2">
                {topGenres.map((item) => (
                  <span
                    key={item.genre}
                    className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#888] text-sm"
                  >
                    {item.genre} <span className="text-[#FF6B50]">({item.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

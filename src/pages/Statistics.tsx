import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getRecentSearches, getLifetimeSearchCount, getAnimeCache } from '../lib/db';
import { BarChart3, TrendingUp, Hash } from 'lucide-react';

export function Statistics() {
  const { t } = useI18n();
  const [totalSearches, setTotalSearches] = useState(0);
  const [topAnime, setTopAnime] = useState<{ anilistId: number; title: string; count: number }[]>([]);
  const [topGenres, setTopGenres] = useState<{ genre: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const count = await getLifetimeSearchCount();
    setTotalSearches(count);

    const searches = await getRecentSearches(50);

    const animeCounts: Record<number, { title: string; count: number }> = {};
    for (const s of searches) {
      if (s.topAnilistId) {
        const title = s.top?.title.romaji || s.top?.title.english || s.top?.title.native || 'UNKNOWN';
        if (!animeCounts[s.topAnilistId]) animeCounts[s.topAnilistId] = { title, count: 0 };
        animeCounts[s.topAnilistId].count++;
      }
    }
    setTopAnime(
      Object.entries(animeCounts)
        .map(([id, data]) => ({ anilistId: parseInt(id), ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    const genreCounts: Record<string, number> = {};
    for (const s of searches) {
      if (s.topAnilistId) {
        const cached = await getAnimeCache(s.topAnilistId);
        if (cached?.genres) {
          for (const genre of cached.genres) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      }
    }
    setTopGenres(
      Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FF4D00]">
        <section className="px-4 sm:px-8 pt-32 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-black" />
              <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// ANALYTICS</span>
            </div>
            <h1 className="font-display text-black mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}>
              STATISTICS
            </h1>
            <div className="border-t-2 border-black" />
          </div>
        </section>
        <section className="bg-black text-white px-4 sm:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-brutal-white p-6">
                <div className="skeleton-brutal h-6 w-1/3 mb-4" />
                <div className="skeleton-brutal h-32 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// ANALYTICS</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
          >
            STATISTICS
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {totalSearches === 0 ? (
            <div className="text-center py-24">
              <BarChart3 size={48} className="mx-auto text-white/20 mb-4" />
              <p className="font-mono-custom text-sm text-white/40">{t('stats.empty')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Total Searches */}
              <div className="border-brutal-white p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Hash size={20} className="text-[#FF4D00]" />
                  <h2 className="font-display text-lg">{t('stats.totalSearches')}</h2>
                </div>
                <p className="font-display text-6xl md:text-8xl text-[#FF4D00]">{totalSearches}</p>
              </div>

              {/* Top Anime */}
              {topAnime.length > 0 && (
                <div className="border-brutal-white p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={20} className="text-[#FF4D00]" />
                    <h2 className="font-display text-lg">{t('stats.topAnime')}</h2>
                  </div>
                  <div className="space-y-0">
                    {topAnime.map((anime, i) => (
                      <div key={anime.anilistId} className="service-item group flex items-center justify-between px-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono-custom text-[#FF4D00] text-xs font-bold w-6">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <a
                            href={`https://anilist.co/anime/${anime.anilistId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-display text-sm truncate hover:text-[#FF4D00] transition-colors service-title"
                          >
                            {anime.title}
                          </a>
                        </div>
                        <span className="font-mono-custom text-xs text-white/60 shrink-0 ml-2">
                          {anime.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Genres */}
              {topGenres.length > 0 && (
                <div className="border-brutal-white p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 size={20} className="text-[#FF4D00]" />
                    <h2 className="font-display text-lg">{t('stats.topGenres')}</h2>
                  </div>
                  <p className="font-mono-custom text-[10px] text-white/40 mb-4">
                    BASED ON ANIME WITH LOADED ANILIST DETAILS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topGenres.map((item) => (
                      <span
                        key={item.genre}
                        className="tag-pill border-white/40 text-white/80 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors cursor-default"
                      >
                        {item.genre.toUpperCase()} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

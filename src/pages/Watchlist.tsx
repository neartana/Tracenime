import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getWatchlist, upsertWatchlist, removeWatchlist } from '../lib/db';
import { fetchAnimeDetails } from '../lib/anilist';
import type { WatchlistRecord, WatchStatus, AnimeCacheRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { ExternalLink, Trash2, Star, AlertCircle, Filter } from 'lucide-react';

const STATUS_OPTIONS: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'watchlist.filterAll' },
  { value: 'planned', label: 'watchlist.planned' },
  { value: 'watching', label: 'watchlist.watching' },
  { value: 'completed', label: 'watchlist.completed' },
  { value: 'dropped', label: 'watchlist.dropped' },
];

export function Watchlist() {
  const { t } = useI18n();
  const [items, setItems] = useState<WatchlistRecord[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: 'planned' as WatchStatus, rating: null as number | null, notes: '', lastEpisode: null as number | null });
  const [animeDetails, setAnimeDetails] = useState<Record<number, AnimeCacheRecord>>({});

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    const data = await getWatchlist();
    setItems(data);
    // Fetch anime details for items without cover
    for (const item of data) {
      if (!animeDetails[item.anilistId]) {
        const details = await fetchAnimeDetails(item.anilistId);
        if (details) {
          setAnimeDetails(prev => ({ ...prev, [item.anilistId]: details }));
        }
      }
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.status === filter);

  const handleDelete = async (anilistId: number) => {
    await removeWatchlist(anilistId);
    setItems(prev => prev.filter(i => i.anilistId !== anilistId));
  };

  const handleSaveEdit = async (anilistId: number) => {
    const existing = items.find(i => i.anilistId === anilistId);
    if (!existing) return;
    const updated = {
      ...existing,
      status: editForm.status,
      rating: editForm.rating,
      notes: editForm.notes,
      lastEpisode: editForm.lastEpisode,
      updatedAt: Date.now(),
    };
    await upsertWatchlist(updated);
    setItems(prev => prev.map(i => i.anilistId === anilistId ? updated : i));
    setEditingId(null);
  };

  const startEdit = (item: WatchlistRecord) => {
    setEditingId(item.anilistId);
    setEditForm({
      status: item.status,
      rating: item.rating,
      notes: item.notes,
      lastEpisode: item.lastEpisode,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('watchlist.title')}</h1>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={14} className="text-[#666] shrink-0" />
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value as WatchStatus | 'all')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === opt.value
                ? 'bg-[#FF6B50] text-black font-medium'
                : 'bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            {t(opt.label)}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#666]">{t('watchlist.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, index) => {
            const details = animeDetails[item.anilistId];
            const coverUrl = details?.coverUrl || item.coverUrl;
            const title = item.title.romaji || item.title.english || item.title.native || 'Unknown';

            return (
              <div
                key={item.anilistId}
                className={`bg-[#111] hover:bg-[#161616] rounded-3xl p-5 transition-colors ${
                  index % 2 === 1 ? 'md:mt-8' : ''
                }`}
              >
                <div className="flex gap-4">
                  {coverUrl && (
                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-[#1a1a1a] shrink-0">
                      <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'watching' ? 'bg-green-500/15 text-green-400' :
                        item.status === 'completed' ? 'bg-blue-500/15 text-blue-400' :
                        item.status === 'dropped' ? 'bg-red-500/15 text-red-400' :
                        'bg-[#FF6B50]/15 text-[#FF6B50]'
                      }`}>
                        {t(`watchlist.${item.status}`)}
                      </span>
                      {item.rating && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star size={10} fill="currentColor" />
                          {item.rating}/10
                        </span>
                      )}
                    </div>
                    {item.lastEpisode && (
                      <p className="text-[#888] text-xs mt-1">{t('watchlist.lastEpisode')}: {item.lastEpisode}</p>
                    )}
                    {item.foundAt && (
                      <p className="text-[#666] text-xs mt-1">
                        {t('watchlist.foundAt', {
                          episode: item.foundAt.episode ?? '—',
                          time: formatTimeRange(item.foundAt.from, item.foundAt.from + 2),
                        })}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[#888] text-xs mt-2 line-clamp-2">{item.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={`https://anilist.co/anime/${item.anilistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-white/10 text-[#888] hover:text-white transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-[#888] hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.anilistId)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-[#888] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit form */}
                {editingId === item.anilistId && (
                  <div className="mt-4 pt-4 border-t border-[#222] space-y-3">
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">{t('misc.status')}</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as WatchStatus }))}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B50]"
                      >
                        <option value="planned">{t('watchlist.planned')}</option>
                        <option value="watching">{t('watchlist.watching')}</option>
                        <option value="completed">{t('watchlist.completed')}</option>
                        <option value="dropped">{t('watchlist.dropped')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">{t('watchlist.rating')} (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editForm.rating || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, rating: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B50]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">{t('watchlist.lastEpisode')}</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.lastEpisode || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastEpisode: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B50]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">{t('watchlist.notes')}</label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value.slice(0, 2000) }))}
                        maxLength={2000}
                        rows={3}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B50] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(item.anilistId)}
                        className="px-4 py-2 bg-[#FF6B50] hover:bg-[#E55A40] text-black font-medium rounded-lg text-sm transition-colors"
                      >
                        {t('misc.save')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#888] rounded-lg text-sm transition-colors"
                      >
                        {t('misc.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { getWatchlist, upsertWatchlist, removeWatchlist } from '../lib/db';
import { fetchAnimeDetails } from '../lib/anilist';
import type { WatchlistRecord, WatchStatus, AnimeCacheRecord } from '../lib/types';
import { formatTimeRange } from '../lib/trace';
import { ExternalLink, Trash2, Star, AlertCircle, ArrowUpRight } from 'lucide-react';

const STATUS_OPTIONS: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'planned', label: 'PLANNED' },
  { value: 'watching', label: 'WATCHING' },
  { value: 'completed', label: 'COMPLETED' },
  { value: 'dropped', label: 'DROPPED' },
];

export function Watchlist() {
  const { t } = useI18n();
  const [items, setItems] = useState<WatchlistRecord[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: 'planned' as WatchStatus, rating: null as number | null, notes: '', lastEpisode: null as number | null });
  const [animeDetails, setAnimeDetails] = useState<Record<number, AnimeCacheRecord>>({});

  useEffect(() => { loadWatchlist(); }, []);

  const loadWatchlist = async () => {
    const data = await getWatchlist();
    setItems(data);
    for (const item of data) {
      if (!animeDetails[item.anilistId]) {
        const details = await fetchAnimeDetails(item.anilistId);
        if (details) setAnimeDetails(prev => ({ ...prev, [item.anilistId]: details }));
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
    const updated = { ...existing, status: editForm.status, rating: editForm.rating, notes: editForm.notes, lastEpisode: editForm.lastEpisode, updatedAt: Date.now() };
    await upsertWatchlist(updated);
    setItems(prev => prev.map(i => i.anilistId === anilistId ? updated : i));
    setEditingId(null);
  };

  const startEdit = (item: WatchlistRecord) => {
    setEditingId(item.anilistId);
    setEditForm({ status: item.status, rating: item.rating, notes: item.notes, lastEpisode: item.lastEpisode });
  };

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// TRACKING</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(3rem, 12vw, 12rem)' }}
          >
            WATCHLIST
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Filter */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as WatchStatus | 'all')}
                className={`font-mono-custom text-xs font-bold uppercase px-4 py-2 border-brutal-white whitespace-nowrap transition-all ${
                  filter === opt.value
                    ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
                    : 'text-white hover:bg-white hover:text-black'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-24">
              <AlertCircle size={48} className="mx-auto text-white/20 mb-4" />
              <p className="font-mono-custom text-sm text-white/40">{t('watchlist.empty')}</p>
            </div>
          ) : (
            <div>
              {filteredItems.map((item, index) => {
                const details = animeDetails[item.anilistId];
                const coverUrl = details?.coverUrl || item.coverUrl;
                const title = item.title.romaji || item.title.english || item.title.native || 'UNKNOWN';

                return (
                  <div key={item.anilistId} className="service-item group">
                    <div className="flex items-start gap-4 px-4">
                      {/* Index */}
                      <span className="font-mono-custom text-[#FF4D00] text-sm font-bold w-8 shrink-0 pt-2">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Cover */}
                      {coverUrl && (
                        <div className="w-20 h-28 border-brutal-white bg-black overflow-hidden shrink-0">
                          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 service-title">
                        <h3 className="font-display text-xl md:text-2xl truncate">{title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`tag-pill ${
                            item.status === 'watching' ? 'border-green-400 text-green-400' :
                            item.status === 'completed' ? 'border-blue-400 text-blue-400' :
                            item.status === 'dropped' ? 'border-red-400 text-red-400' :
                            'border-[#FF4D00] text-[#FF4D00]'
                          }`}>
                            {t(`watchlist.${item.status}`)}
                          </span>
                          {item.rating && (
                            <span className="tag-pill border-yellow-400 text-yellow-400 flex items-center gap-1">
                              <Star size={10} fill="currentColor" />
                              {item.rating}/10
                            </span>
                          )}
                          {item.lastEpisode && (
                            <span className="tag-pill border-white/40 text-white/60">
                              EP.{item.lastEpisode}
                            </span>
                          )}
                        </div>
                        {item.foundAt && (
                          <p className="font-mono-custom text-[10px] text-white/40 mt-2">
                            FOUND AT EP.{item.foundAt.episode ?? '—'}, {formatTimeRange(item.foundAt.from, item.foundAt.from + 2)}
                          </p>
                        )}
                        {item.notes && (
                          <p className="font-mono-custom text-xs text-white/60 mt-2 line-clamp-2">{item.notes}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <a
                            href={`https://anilist.co/anime/${item.anilistId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-brutal text-xs border-white text-white hover:bg-white hover:text-black py-1 px-3"
                          >
                            <ExternalLink size={12} className="inline mr-1" />
                            ANILIST
                          </a>
                          <button
                            onClick={() => startEdit(item)}
                            className="btn-brutal text-xs border-[#FF4D00] text-[#FF4D00] hover:bg-[#FF4D00] hover:text-black py-1 px-3"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDelete(item.anilistId)}
                            className="p-2 border-brutal-white text-white/40 hover:text-red-400 hover:border-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="service-arrow shrink-0 pt-2">
                        <ArrowUpRight size={32} className="text-[#FF4D00]" />
                      </div>
                    </div>

                    {/* Edit Form */}
                    {editingId === item.anilistId && (
                      <div className="mt-6 pt-6 border-t border-white/20 px-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="font-mono-custom text-[10px] text-white/60 uppercase mb-1 block">STATUS</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as WatchStatus }))}
                              className="input-brutal input-brutal-dark w-full text-xs"
                            >
                              <option value="planned">{t('watchlist.planned')}</option>
                              <option value="watching">{t('watchlist.watching')}</option>
                              <option value="completed">{t('watchlist.completed')}</option>
                              <option value="dropped">{t('watchlist.dropped')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-mono-custom text-[10px] text-white/60 uppercase mb-1 block">RATING (1-10)</label>
                            <input
                              type="number" min={1} max={10}
                              value={editForm.rating || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, rating: e.target.value ? parseInt(e.target.value) : null }))}
                              className="input-brutal input-brutal-dark w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-mono-custom text-[10px] text-white/60 uppercase mb-1 block">LAST EPISODE</label>
                            <input
                              type="number" min={1}
                              value={editForm.lastEpisode || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, lastEpisode: e.target.value ? parseInt(e.target.value) : null }))}
                              className="input-brutal input-brutal-dark w-full text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-mono-custom text-[10px] text-white/60 uppercase mb-1 block">NOTES</label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value.slice(0, 2000) }))}
                            maxLength={2000} rows={3}
                            className="input-brutal input-brutal-dark w-full text-xs resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(item.anilistId)} className="btn-brutal text-xs bg-[#FF4D00] border-[#FF4D00] text-black">
                            SAVE
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-brutal text-xs border-white text-white hover:bg-white hover:text-black">
                            CANCEL
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
      </section>
    </div>
  );
}

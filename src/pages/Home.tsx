import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { validateFile, validateUrl, compressImage, createThumbnail, buildCacheKey } from '../lib/image';
import { searchByImage, searchByUrl, getQuota, formatTimeRange } from '../lib/trace';
import { fetchAnimeDetails } from '../lib/anilist';
import {
  addSearch, getCacheEntry, setCacheEntry, getRecentSearches,
  getAnimeCache, setAnimeCache, addFavorite, removeFavorite, isFavorite,
  upsertWatchlist, incrementSearchCount,
} from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { TraceResultStored, SearchRecord, QuotaInfo, AnimeCacheRecord, SearchState, SearchOptions } from '../lib/types';
import {
  Upload, Link as LinkIcon, Search, AlertTriangle, Heart, ExternalLink,
  Play, Loader2, Image as ImageIcon, X, Check, BookmarkPlus, Copy,
} from 'lucide-react';

function SimilarityBadge({ similarity }: { similarity: number }) {
  const pct = Math.round(similarity * 100);
  let cls = 'badge-red';
  if (similarity >= 0.9) cls = 'badge-green';
  else if (similarity >= 0.8) cls = 'badge-yellow';
  return (
    <span className={`${cls} px-2 py-0.5 rounded-full text-xs font-medium`}>
      {pct}%
    </span>
  );
}

function ResultCard({
  result,
  isFav,
  onToggleFav,
  onSaveWatchlist,
  t,
}: {
  result: TraceResultStored;
  isFav: boolean;
  onToggleFav: () => void;
  onSaveWatchlist: () => void;
  t: (key: string) => string;
}) {
  const title = result.title.romaji || result.title.english || result.title.native || 'Unknown';
  const [copied, setCopied] = useState(false);

  const copyTitle = async () => {
    const text = `${title} - Ep ${result.episode ?? '-'} - ${formatTimeRange(result.from, result.to)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111] hover:bg-[#161616] rounded-3xl p-5 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <SimilarityBadge similarity={result.similarity} />
        <div className="flex items-center gap-2">
          <button
            onClick={copyTitle}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#888] hover:text-white transition-colors"
            title={t('misc.copy')}
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={onToggleFav}
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isFav ? 'text-[#FF6B50]' : 'text-[#888] hover:text-white'}`}
            title={isFav ? t('results.unfavorite') : t('results.favorite')}
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {result.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-4 aspect-video bg-[#1a1a1a]">
          <img
            src={result.imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            loading="lazy"
          />
          {result.videoUrl && (
            <>
              <video
                src={result.videoUrl}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                muted
                loop
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                <div className="bg-black/50 rounded-full p-3">
                  <Play size={20} className="text-white" fill="white" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">{title}</h3>
      {result.title.english && result.title.english !== title && (
        <p className="text-[#888] text-sm mb-1">{result.title.english}</p>
      )}
      {result.title.native && (
        <p className="text-[#666] text-sm mb-2">{result.title.native}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-[#888] mb-4">
        <span>{t('results.episode')}: {result.episode ?? '—'}</span>
        <span>{formatTimeRange(result.from, result.to)}</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`https://anilist.co/anime/${result.anilistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] hover:text-white text-sm transition-colors"
        >
          <ExternalLink size={12} />
          AniList
        </a>
        <button
          onClick={onSaveWatchlist}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B50]/10 hover:bg-[#FF6B50]/20 text-[#FF6B50] text-sm transition-colors"
        >
          <BookmarkPlus size={12} />
          {t('results.saveWatchlist')}
        </button>
      </div>
    </div>
  );
}

function LowConfidenceBanner({ t }: { t: (key: string) => string }) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-yellow-500 font-medium mb-1">{t('lowConfidence.title')}</h3>
          <p className="text-[#888] text-sm mb-2">{t('lowConfidence.message')}</p>
          <p className="text-[#666] text-xs">{t('lowConfidence.note')}</p>
        </div>
      </div>
    </div>
  );
}

function QuotaIndicator({ quota, t }: { quota: QuotaInfo | null; t: (key: string, params?: Record<string, string | number>) => string }) {
  if (!quota) return null;
  return (
    <div className="group relative inline-flex items-center gap-2 text-sm">
      <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
      <span className="text-[#888] group-hover:text-[#FF6B50] transition-colors cursor-default">
        {t('quota.remaining', { count: quota.remaining })}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1a1a1a] rounded-lg text-xs text-[#888] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {t('quota.tooltip', { used: quota.quotaUsed, total: quota.quota })}
      </div>
    </div>
  );
}

export function Home() {
  const { t } = useI18n();
  const [state, setState] = useState<SearchState>('idle');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<SearchOptions>({ cutBorders: false });
  const [results, setResults] = useState<TraceResultStored[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([]);
  const [favStates, setFavStates] = useState<Record<string, boolean>>({});
  const [fromCache, setFromCache] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchMode, setSearchMode] = useState<'file' | 'url'>('file');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    getQuota().then(setQuota);
    getRecentSearches(3).then(setRecentSearches);
  }, []);

  // Check URL params for shared search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url) {
      setImageUrl(url);
      setSearchMode('url');
      setOptions({
        cutBorders: params.get('cut') === '1',
        anilistId: params.get('anilist') ? parseInt(params.get('anilist')!) : undefined,
      });
      // Auto-search
      setTimeout(() => handleSearch(url, { cutBorders: params.get('cut') === '1', anilistId: params.get('anilist') ? parseInt(params.get('anilist')!) : undefined }), 100);
    }
  }, []);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            e.preventDefault();
            return;
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setImageFile(file);
    setSearchMode('file');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setState('ready');
    setResults(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSearch = async (urlOverride?: string, optionsOverride?: SearchOptions) => {
    const searchOptions = optionsOverride || options;
    const isUrlMode = searchMode === 'url' || !!urlOverride;
    setError(null);
    setState('processing');

    try {
      let imageHash: string;
      let thumbnail: string;
      let cacheKey: string;

      if (isUrlMode) {
        const url = urlOverride || imageUrl;
        if (!url) {
          setError('Please enter an image URL.');
          setState('idle');
          return;
        }
        const urlError = validateUrl(url);
        if (urlError) {
          setError(urlError);
          setState('idle');
          return;
        }

        // Hash the URL for cache
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(url));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        imageHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        thumbnail = '';
        cacheKey = buildCacheKey(imageHash, searchOptions);
      } else {
        if (!imageFile) {
          setError('Please select an image first.');
          setState('idle');
          return;
        }

        setState('processing');
        const compressed = await compressImage(imageFile);
        imageHash = compressed.hash;
        thumbnail = await createThumbnail(imageFile);
        cacheKey = buildCacheKey(imageHash, searchOptions);
      }

      // Check cache
      setState('checking-cache');
      const cached = await getCacheEntry(cacheKey);
      if (cached) {
        setResults(cached.results);
        setFromCache(true);
        setState('done');
        return;
      }

      // Search
      setState('searching');
      let searchResult;
      if (isUrlMode) {
        searchResult = await searchByUrl(urlOverride || imageUrl, searchOptions);
      } else {
        const compressed = await compressImage(imageFile!);
        searchResult = await searchByImage(compressed.blob, searchOptions);
      }

      setResults(searchResult.results);
      setFromCache(false);

      // Save to cache
      await setCacheEntry({
        cacheKey,
        imageHash,
        options: searchOptions,
        frameCount: searchResult.frameCount,
        results: searchResult.results,
        cachedAt: Date.now(),
      });

      // Save to history
      const topResult = searchResult.results[0] || null;
      const searchRecord: SearchRecord = {
        id: uuidv4(),
        createdAt: Date.now(),
        source: isUrlMode ? 'url' : 'upload',
        sourceUrl: isUrlMode ? (urlOverride || imageUrl) : undefined,
        imageHash,
        thumbnail,
        options: searchOptions,
        cacheKey,
        fromCache: false,
        topAnilistId: topResult?.anilistId ?? null,
        top: topResult ? {
          anilistId: topResult.anilistId,
          title: topResult.title,
          episode: topResult.episode,
          from: topResult.from,
          to: topResult.to,
          similarity: topResult.similarity,
        } : null,
        resultCount: searchResult.results.length,
      };
      await addSearch(searchRecord);
      await incrementSearchCount();

      // Refresh quota
      const newQuota = await getQuota();
      if (newQuota) setQuota(newQuota);

      // Refresh recent
      getRecentSearches(3).then(setRecentSearches);

      // Update URL for shareable links (URL searches only)
      if (isUrlMode) {
        const params = new URLSearchParams();
        params.set('url', urlOverride || imageUrl);
        if (searchOptions.cutBorders) params.set('cut', '1');
        if (searchOptions.anilistId) params.set('anilist', searchOptions.anilistId.toString());
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }

      setState('done');
    } catch (err) {
      const error = err as { code: string; message: string; retryAfter?: number };
      if (error.code === 'RATE_LIMITED' && error.retryAfter) {
        setError(t('error.rateLimited', { seconds: error.retryAfter }));
      } else if (error.code === 'QUOTA_EXHAUSTED') {
        setError(t('error.quotaExhausted'));
      } else if (error.code === 'UPSTREAM_TIMEOUT') {
        setError(t('error.timeout'));
      } else {
        setError(error.message || t('error.generic'));
      }
      setState('error');
    }
  };

  const toggleFavorite = async (result: TraceResultStored) => {
    const sceneKey = `${result.anilistId}:${result.episode ?? 'x'}:${Math.round(result.from)}`;
    const currentFav = favStates[sceneKey] ?? await isFavorite(sceneKey);

    if (currentFav) {
      await removeFavorite(sceneKey);
      setFavStates(prev => ({ ...prev, [sceneKey]: false }));
    } else {
      await addFavorite({
        sceneKey,
        anilistId: result.anilistId,
        title: result.title,
        episode: result.episode,
        from: result.from,
        to: result.to,
        similarity: result.similarity,
        thumbnail: previewUrl || '',
        createdAt: Date.now(),
      });
      setFavStates(prev => ({ ...prev, [sceneKey]: true }));
    }
  };

  const saveToWatchlist = async (result: TraceResultStored) => {
    // Fetch anime details if not cached
    let animeData = await getAnimeCache(result.anilistId);
    if (!animeData) {
      animeData = await fetchAnimeDetails(result.anilistId);
      if (animeData) await setAnimeCache(animeData);
    }

    await upsertWatchlist({
      anilistId: result.anilistId,
      title: result.title,
      coverUrl: animeData?.coverUrl || null,
      status: 'planned',
      lastEpisode: typeof result.episode === 'number' ? result.episode : null,
      rating: null,
      notes: '',
      foundAt: {
        episode: result.episode,
        from: result.from,
      },
      addedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    setState('idle');
  };

  const isLoading = state === 'processing' || state === 'checking-cache' || state === 'searching';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mt-4 text-center">
          <p className="text-yellow-400 text-sm">{t('error.offline')}</p>
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-12 pb-8 text-center">
        <div className="hero-glow" />
        <h1 className="relative text-[11vw] md:text-[8vw] font-bold tracking-tight-custom text-white leading-none mb-4 animate-fade-in">
          /tracenime
        </h1>
        <p className="relative text-[#888] text-lg md:text-xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {t('hero.subtitle')}
        </p>

        <div className="relative">
          <QuotaIndicator quota={quota} t={t} />
        </div>
      </section>

      {/* Dropzone / Input */}
      <section className="mb-8">
        {!previewUrl ? (
          <div
            className={`relative dropzone-border rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragOver ? 'active border-[#FF6B50] bg-[#FF6B50]/5 scale-[1.01]' : 'hover:border-[#555] hover:bg-[#111]/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isDragOver && (
              <div className="absolute inset-0 rounded-3xl bg-[#FF6B50]/5 pointer-events-none" />
            )}
            <div className={`transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
              <Upload size={48} className={`mx-auto mb-4 transition-colors ${isDragOver ? 'text-[#FF6B50]' : 'text-[#666]'}`} />
            </div>
            <p className="text-[#888] text-lg mb-2">{t('hero.dropzone')}</p>
            <p className="text-[#444] text-sm">JPEG, PNG, WebP, GIF • Max 25 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        ) : (
          <div className="bg-[#111] rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#888] text-sm flex items-center gap-2">
                <ImageIcon size={14} />
                {imageFile?.name || 'URL image'}
              </span>
              <button
                onClick={clearImage}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#888] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-[#1a1a1a]">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* URL Input Toggle */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setSearchMode('file')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              searchMode === 'file' ? 'bg-white/10 text-white' : 'text-[#888] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2"><Upload size={14} /> File</span>
          </button>
          <button
            onClick={() => setSearchMode('url')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              searchMode === 'url' ? 'bg-white/10 text-white' : 'text-[#888] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2"><LinkIcon size={14} /> URL</span>
          </button>
        </div>

        {searchMode === 'url' && (
          <div className="mt-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t('hero.urlPlaceholder')}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#FF6B50] transition-colors"
            />
            {imageUrl && validateUrl(imageUrl) === null && !previewUrl && (
              <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-[#1a1a1a] max-h-48">
                <img
                  src={imageUrl}
                  alt="URL preview"
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[#888] cursor-pointer">
            <input
              type="checkbox"
              checked={options.cutBorders}
              onChange={(e) => setOptions(prev => ({ ...prev, cutBorders: e.target.checked }))}
              className="rounded border-[#333] bg-[#111] text-[#FF6B50] focus:ring-[#FF6B50]"
            />
            {t('options.cutBorders')}
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888]">{t('options.anilistId')}:</label>
            <input
              type="number"
              value={options.anilistId || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, anilistId: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="ID"
              className="w-20 bg-[#111] border border-[#333] rounded-lg px-2 py-1 text-white text-sm placeholder:text-[#666] focus:outline-none focus:border-[#FF6B50]"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleSearch()}
            disabled={isLoading || (searchMode === 'file' && !imageFile) || (searchMode === 'url' && !imageUrl.trim())}
            className="w-full sm:w-auto px-8 py-3 bg-[#FF6B50] hover:bg-[#E55A40] disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-[#FF6B50]/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('options.searching')}
              </>
            ) : (
              <>
                <Search size={18} />
                {t('options.search')}
              </>
            )}
          </button>
          {fromCache && results && (
            <span className="text-sm text-[#666] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {t('results.fromCache')}
            </span>
          )}
          {results && searchMode === 'url' && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#888] hover:text-white text-sm transition-colors flex items-center gap-2"
            >
              <LinkIcon size={14} />
              Copy link
            </button>
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111] rounded-3xl p-5">
              <div className="skeleton h-4 w-16 rounded mb-4" />
              <div className="skeleton h-40 w-full rounded-2xl mb-4" />
              <div className="skeleton h-5 w-3/4 rounded mb-2" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results && !isLoading && (
        <section className="mb-8">
          {results[0] && results[0].similarity < 0.9 && <LowConfidenceBanner t={t} />}

          <div className="space-y-4">
            {results.map((result, i) => {
              const sceneKey = `${result.anilistId}:${result.episode ?? 'x'}:${Math.round(result.from)}`;
              return (
                <div key={`${result.anilistId}-${i}`} className="result-card-enter">
                  <ResultCard
                    result={result}
                    isFav={favStates[sceneKey] || false}
                    onToggleFav={() => toggleFavorite(result)}
                    onSaveWatchlist={() => saveToWatchlist(result)}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !results && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
            <span className="text-xs uppercase tracking-wide-custom text-[#888]">{t('hero.recentSearches')}</span>
          </div>
          <div className="flex gap-3">
            {recentSearches.map(s => (
              <div key={s.id} className="w-16 h-16 rounded-xl overflow-hidden bg-[#111] thumbnail-hover">
                {s.thumbnail && (
                  <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-12 border-t border-[#222] mt-12">
        <p className="text-[4vw] md:text-[3vw] font-bold tracking-tight-custom text-[#333] mb-4">
          SEARCH AGAIN.
        </p>
        <p className="text-[#666] text-sm mb-2">{t('about.credits')}</p>
        <p className="text-[#444] text-xs">{t('about.notAffiliated')}</p>
      </footer>
    </div>
  );
}

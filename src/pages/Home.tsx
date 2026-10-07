import React, { useState, useRef, useEffect } from 'react';
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
import type { TraceResultStored, SearchRecord, QuotaInfo, SearchState, SearchOptions } from '../lib/types';
import {
  Upload, Link as LinkIcon, Search, AlertTriangle, Heart, ExternalLink,
  Play, Loader2, X, Check, BookmarkPlus, Copy, ChevronDown, ArrowUpRight,
} from 'lucide-react';

// Rotating Scroll Indicator
function ScrollIndicator() {
  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full animate-spin-slow" viewBox="0 0 144 144">
        <defs>
          <path
            id="circlePath"
            d="M 72, 72 m -58, 0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
          />
        </defs>
        <text className="font-mono-custom" fill="#000" fontSize="9" fontWeight="700" letterSpacing="2">
          <textPath href="#circlePath">
            SCROLL DOWN • SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <ChevronDown size={24} className="text-black" />
      </div>
    </div>
  );
}

// Marquee Section
function MarqueeSection() {
  const items = ['IDENTIFY', '•', 'TRACK', '•', 'DISCOVER', '•', 'ANIME', '•', 'SCENES', '•', 'EPISODES', '•'];
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="bg-black skew-section py-8 overflow-hidden">
      <div className="skew-section-content">
        <div className="animate-marquee flex whitespace-nowrap">
          {repeated.map((item, i) => (
            <span
              key={i}
              className="font-display text-[#FF4D00] mx-4"
              style={{ fontSize: 'clamp(3rem, 10vw, 10rem)' }}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="animate-marquee-reverse flex whitespace-nowrap mt-2">
          {repeated.map((item, i) => (
            <span
              key={i}
              className="font-display text-white/80 mx-4"
              style={{ fontSize: 'clamp(2rem, 8vw, 8rem)' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const pct = Math.round(similarity * 100);
  let cls = 'badge-red';
  if (similarity >= 0.9) cls = 'badge-green';
  else if (similarity >= 0.8) cls = 'badge-yellow';
  return (
    <span className={`badge-brutal ${cls}`}>
      {pct}% MATCH
    </span>
  );
}

function ResultCard({
  result,
  isFav,
  onToggleFav,
  onSaveWatchlist,
  t,
  index,
}: {
  result: TraceResultStored;
  isFav: boolean;
  onToggleFav: () => void;
  onSaveWatchlist: () => void;
  t: (key: string) => string;
  index: number;
}) {
  const title = result.title.romaji || result.title.english || result.title.native || 'UNKNOWN';
  const [copied, setCopied] = useState(false);

  const copyTitle = async () => {
    const text = `${title} - EP ${result.episode ?? '-'} - ${formatTimeRange(result.from, result.to)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-brutal p-0 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        {result.imageUrl && (
          <div className="relative md:w-72 h-48 md:h-auto bg-black shrink-0 overflow-hidden group">
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
              </>
            )}
            {/* Index number overlay */}
            <div className="absolute top-2 left-2 font-mono-custom text-white text-xs font-bold bg-black/70 px-2 py-1">
              #{String(index + 1).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <SimilarityBadge similarity={result.similarity} />
            <div className="flex items-center gap-1">
              <button
                onClick={copyTitle}
                className="p-2 border-brutal hover:bg-black hover:text-white transition-colors"
                title={t('misc.copy')}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={onToggleFav}
                className={`p-2 border-brutal transition-colors ${isFav ? 'bg-black text-[#FF4D00]' : 'hover:bg-black hover:text-white'}`}
                title={isFav ? t('results.unfavorite') : t('results.favorite')}
              >
                <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <h3 className="font-display text-xl md:text-2xl mb-2 leading-tight">{title}</h3>
          {result.title.english && result.title.english !== title && (
            <p className="font-mono-custom text-xs text-black/60 mb-1">{result.title.english}</p>
          )}

          <div className="flex items-center gap-4 font-mono-custom text-xs mb-4">
            <span className="border-brutal px-2 py-1">EP: {result.episode ?? '—'}</span>
            <span className="border-brutal px-2 py-1">{formatTimeRange(result.from, result.to)}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://anilist.co/anime/${result.anilistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brutal btn-brutal-black text-xs flex items-center gap-2 py-2 px-3"
            >
              <ExternalLink size={12} />
              ANILIST
            </a>
            <button
              onClick={onSaveWatchlist}
              className="btn-brutal btn-brutal-orange text-xs flex items-center gap-2 py-2 px-3"
            >
              <BookmarkPlus size={12} />
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LowConfidenceBanner({ t }: { t: (key: string) => string }) {
  return (
    <div className="border-brutal bg-black text-white p-5 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={24} className="text-[#FF4D00] mt-0.5 shrink-0" />
        <div>
          <h3 className="font-display text-lg mb-1 text-[#FF4D00]">{t('lowConfidence.title')}</h3>
          <p className="font-mono-custom text-xs text-white/80 mb-2">{t('lowConfidence.message')}</p>
          <p className="font-mono-custom text-[10px] text-white/50">{t('lowConfidence.note')}</p>
        </div>
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

  useEffect(() => {
    getQuota().then(setQuota);
    getRecentSearches(3).then(setRecentSearches);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) { handleFileSelect(file); e.preventDefault(); return; }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setImageFile(file);
    setSearchMode('file');
    setPreviewUrl(URL.createObjectURL(file));
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
        if (!url) { setError('ENTER A URL'); setState('idle'); return; }
        const urlError = validateUrl(url);
        if (urlError) { setError(urlError); setState('idle'); return; }
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(url));
        imageHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        thumbnail = '';
        cacheKey = buildCacheKey(imageHash, searchOptions);
      } else {
        if (!imageFile) { setError('SELECT AN IMAGE'); setState('idle'); return; }
        const compressed = await compressImage(imageFile);
        imageHash = compressed.hash;
        thumbnail = await createThumbnail(imageFile);
        cacheKey = buildCacheKey(imageHash, searchOptions);
      }

      setState('checking-cache');
      const cached = await getCacheEntry(cacheKey);
      if (cached) { setResults(cached.results); setFromCache(true); setState('done'); return; }

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

      await setCacheEntry({
        cacheKey, imageHash, options: searchOptions,
        frameCount: searchResult.frameCount,
        results: searchResult.results,
        cachedAt: Date.now(),
      });

      const topResult = searchResult.results[0] || null;
      await addSearch({
        id: uuidv4(), createdAt: Date.now(),
        source: isUrlMode ? 'url' : 'upload',
        sourceUrl: isUrlMode ? (urlOverride || imageUrl) : undefined,
        imageHash, thumbnail, options: searchOptions, cacheKey, fromCache: false,
        topAnilistId: topResult?.anilistId ?? null,
        top: topResult ? { anilistId: topResult.anilistId, title: topResult.title, episode: topResult.episode, from: topResult.from, to: topResult.to, similarity: topResult.similarity } : null,
        resultCount: searchResult.results.length,
      });
      await incrementSearchCount();

      const newQuota = await getQuota();
      if (newQuota) setQuota(newQuota);
      getRecentSearches(3).then(setRecentSearches);

      if (isUrlMode) {
        const params = new URLSearchParams();
        params.set('url', urlOverride || imageUrl);
        if (searchOptions.cutBorders) params.set('cut', '1');
        if (searchOptions.anilistId) params.set('anilist', searchOptions.anilistId.toString());
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }

      setState('done');
    } catch (err) {
      const e = err as { code: string; message: string; retryAfter?: number };
      if (e.code === 'RATE_LIMITED' && e.retryAfter) setError(`TOO MANY REQUESTS. WAIT ${e.retryAfter}S`);
      else if (e.code === 'QUOTA_EXHAUSTED') setError(t('error.quotaExhausted'));
      else if (e.code === 'UPSTREAM_TIMEOUT') setError(t('error.timeout'));
      else setError(e.message || t('error.generic'));
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
        sceneKey, anilistId: result.anilistId, title: result.title,
        episode: result.episode, from: result.from, to: result.to,
        similarity: result.similarity, thumbnail: previewUrl || '', createdAt: Date.now(),
      });
      setFavStates(prev => ({ ...prev, [sceneKey]: true }));
    }
  };

  const saveToWatchlist = async (result: TraceResultStored) => {
    let animeData = await getAnimeCache(result.anilistId);
    if (!animeData) {
      animeData = await fetchAnimeDetails(result.anilistId);
      if (animeData) await setAnimeCache(animeData);
    }
    await upsertWatchlist({
      anilistId: result.anilistId, title: result.title, coverUrl: animeData?.coverUrl || null,
      status: 'planned', lastEpisode: typeof result.episode === 'number' ? result.episode : null,
      rating: null, notes: '', foundAt: { episode: result.episode, from: result.from },
      addedAt: Date.now(), updatedAt: Date.now(),
    });
  };

  const clearImage = () => {
    setImageFile(null); setPreviewUrl(null); setResults(null); setError(null); setState('idle');
  };

  const isLoading = state === 'processing' || state === 'checking-cache' || state === 'searching';

  return (
    <div>
      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 pt-24 pb-12">
        <div className="max-w-7xl mx-auto w-full">
          {/* Main Title */}
          <h1
            className="font-display text-black text-center mb-8"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 8rem)' }}
          >
            /TRACENIME
          </h1>

          {/* Border separator */}
          <div className="border-t-2 border-black my-8" />

          {/* Metadata row */}
          <div className="flex items-center justify-between gap-4 font-mono-custom text-xs">
            <div className="text-black/70">
              <span className="uppercase">BASED IN</span>
              <br />
              <span className="font-bold">TRACE.MOE × ANILIST</span>
            </div>

            <div className="hidden md:block">
              <ScrollIndicator />
            </div>

            <div className="text-right text-black">
              <span className="uppercase block">FIND ANIME</span>
              <span className="uppercase block">FROM A SCREENSHOT</span>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <MarqueeSection />

      {/* SEARCH SECTION */}
      <section className="bg-[#FF4D00] px-4 sm:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">
              {state === 'searching' ? '// SEARCHING...' : state === 'done' ? '// RESULTS' : '// UPLOAD OR PASTE'}
            </span>
          </div>

          {isOffline && (
            <div className="border-brutal bg-black text-white p-4 mb-6 font-mono-custom text-xs">
              ⚠ {t('error.offline')}
            </div>
          )}

          {/* Dropzone / Preview */}
          {!previewUrl ? (
            <div className="relative">
              {quota && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="border-brutal bg-black text-[#FF4D00] px-3 py-1.5 font-mono-custom text-xs font-bold">
                    {quota.remaining} SEARCHES LEFT
                  </div>
                </div>
              )}
              <div
                className={`dropzone-brutal p-8 md:p-16 text-center cursor-pointer ${isDragOver ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="mx-auto mb-4 text-black" />
                <p className="font-display text-2xl md:text-3xl mb-2">DROP IMAGE</p>
                <p className="font-mono-custom text-xs text-black/60">
                  CLICK • PASTE (CTRL+V) • DRAG & DROP
                </p>
                <p className="font-mono-custom text-[10px] text-black/40 mt-2">
                  JPEG, PNG, WEBP, GIF • MAX 25MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
              </div>
            </div>
          ) : (
            <div className="border-brutal bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-custom text-xs font-bold">
                  {imageFile?.name?.toUpperCase() || 'URL IMAGE'}
                </span>
                <button onClick={clearImage} className="p-2 border-brutal hover:bg-black hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="border-brutal aspect-video bg-black overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setSearchMode('file')}
              className={`font-mono-custom text-xs font-bold uppercase px-4 py-2 border-brutal transition-all ${
                searchMode === 'file' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2"><Upload size={12} /> FILE</span>
            </button>
            <button
              onClick={() => setSearchMode('url')}
              className={`font-mono-custom text-xs font-bold uppercase px-4 py-2 border-brutal transition-all ${
                searchMode === 'url' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2"><LinkIcon size={12} /> URL</span>
            </button>
          </div>

          {/* URL Input */}
          {searchMode === 'url' && (
            <div className="mt-4">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="HTTPS://EXAMPLE.COM/IMAGE.JPG"
                className="input-brutal w-full uppercase"
              />
            </div>
          )}

          {/* Options */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <label className="flex items-center gap-2 font-mono-custom text-xs font-bold cursor-pointer uppercase">
              <input
                type="checkbox"
                checked={options.cutBorders}
                onChange={(e) => setOptions(prev => ({ ...prev, cutBorders: e.target.checked }))}
                className="checkbox-brutal"
              />
              TRIM BORDERS
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono-custom text-xs font-bold uppercase">ANILIST ID:</span>
              <input
                type="number"
                value={options.anilistId || ''}
                onChange={(e) => setOptions(prev => ({ ...prev, anilistId: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="#"
                className="input-brutal w-20 text-center text-xs"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || (searchMode === 'file' && !imageFile) || (searchMode === 'url' && !imageUrl.trim())}
              className="btn-brutal btn-brutal-black text-sm disabled:opacity-30 flex items-center gap-3 hover:translate-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  SEARCHING...
                </>
              ) : (
                <>
                  <Search size={18} />
                  SEARCH NOW
                </>
              )}
            </button>
            {fromCache && results && (
              <span className="font-mono-custom text-xs font-bold border-brutal px-3 py-1 bg-black text-[#FF4D00]">
                ✓ FROM CACHE
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="border-brutal bg-black text-[#FF4D00] p-4 mt-6 font-mono-custom text-xs font-bold">
              ⚠ {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="border-brutal bg-white p-5">
                  <div className="flex gap-4">
                    <div className="skeleton-brutal w-48 h-32 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="skeleton-brutal h-4 w-16" />
                      <div className="skeleton-brutal h-8 w-3/4" />
                      <div className="skeleton-brutal h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {results && !isLoading && (
            <div className="mt-8 space-y-4">
              {results[0] && results[0].similarity < 0.9 && <LowConfidenceBanner t={t} />}
              {results.map((result, i) => {
                const sceneKey = `${result.anilistId}:${result.episode ?? 'x'}:${Math.round(result.from)}`;
                return (
                  <ResultCard
                    key={`${result.anilistId}-${i}`}
                    result={result}
                    isFav={favStates[sceneKey] || false}
                    onToggleFav={() => toggleFavorite(result)}
                    onSaveWatchlist={() => saveToWatchlist(result)}
                    t={t}
                    index={i}
                  />
                );
              })}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !results && !isLoading && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-black" />
                <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// RECENT</span>
              </div>
              <div className="flex gap-3">
                {recentSearches.map(s => (
                  <div key={s.id} className="w-20 h-20 border-brutal bg-black overflow-hidden">
                    {s.thumbnail && (
                      <img src={s.thumbnail} alt="" className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-black text-white px-4 sm:px-8 py-24 text-center">
        <h2
          className="font-display text-white mb-12"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 8rem)' }}
        >
          SEARCH<br />AGAIN.
        </h2>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-3 bg-white text-black font-display text-lg px-10 py-5 rounded-full hover:scale-110 transition-transform"
        >
          <ArrowUpRight size={24} />
          BACK TO TOP
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#FF4D00] border-t-2 border-black px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono-custom text-xs text-black/60">
            © 2026 TRACENIME — ALL RIGHTS RESERVED
          </div>
          <div className="flex items-center gap-6 font-mono-custom text-xs text-black/60">
            <span>POWERED BY TRACE.MOE & ANILIST</span>
            <span>NOT AFFILIATED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Core types for Tracenime

export type SearchSource = 'upload' | 'paste' | 'url' | 'video-frame' | 'batch';
export type WatchStatus = 'planned' | 'watching' | 'completed' | 'dropped';

export interface Title {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface SearchOptions {
  cutBorders: boolean;
  anilistId?: number;
}

export interface MatchSummary {
  anilistId: number;
  title: Title;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
}

export interface SearchRecord {
  id: string;
  createdAt: number;
  source: SearchSource;
  sourceUrl?: string;
  imageHash: string;
  thumbnail: string;
  options: SearchOptions;
  cacheKey: string;
  fromCache: boolean;
  topAnilistId: number | null;
  top: MatchSummary | null;
  resultCount: number;
}

export interface TraceResultStored extends MatchSummary {
  idMal: number | null;
  synonyms: string[];
  filename: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface SearchCacheRecord {
  cacheKey: string;
  imageHash: string;
  options: SearchOptions;
  frameCount: number;
  results: TraceResultStored[];
  cachedAt: number;
}

export interface AnimeCacheRecord {
  anilistId: number;
  idMal: number | null;
  title: Title;
  coverUrl: string | null;
  coverColor: string | null;
  genres: string[];
  description: string | null;
  episodes: number | null;
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | null;
  season: string | null;
  seasonYear: number | null;
  nextAiring: { episode: number; airingAt: number } | null;
  streamingLinks: { site: string; url: string; icon: string | null }[];
  siteUrl: string;
  fetchedAt: number;
}

export interface FavoriteRecord {
  sceneKey: string;
  anilistId: number;
  title: Title;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
  thumbnail: string;
  createdAt: number;
}

export interface WatchlistRecord {
  anilistId: number;
  title: Title;
  coverUrl: string | null;
  status: WatchStatus;
  lastEpisode: number | null;
  rating: number | null;
  notes: string;
  foundAt: { episode: number | string | null; from: number; searchId?: string } | null;
  addedAt: number;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface QuotaInfo {
  priority: number;
  concurrency: number;
  quota: number;
  quotaUsed: number;
  remaining: number;
}

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'QUOTA_EXHAUSTED'
  | 'INVALID_API_KEY'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'INTERNAL'
  | 'OFFLINE';

export interface TracenimeError {
  code: ErrorCode;
  message: string;
  status?: number;
  retryAfter?: number;
}

export type SearchState = 'idle' | 'ready' | 'processing' | 'checking-cache' | 'searching' | 'done' | 'error';

export interface SearchResult {
  results: TraceResultStored[];
  frameCount: number;
  fromCache: boolean;
}

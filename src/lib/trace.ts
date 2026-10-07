import type { TraceResultStored, QuotaInfo, TracenimeError, SearchOptions } from './types';

const TRACE_MOE_BASE = 'https://api.trace.moe';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeRange(from: number, to: number): string {
  return `${formatTime(from)} - ${formatTime(to)}`;
}

function mapTraceError(status: number, retryAfter?: number): TracenimeError {
  switch (status) {
    case 400: return { code: 'INVALID_INPUT', message: 'Invalid image or parameters.', status: 400 };
    case 402: return { code: 'QUOTA_EXHAUSTED', message: 'Search quota exhausted. Try again later.', status: 402 };
    case 403: return { code: 'INVALID_API_KEY', message: 'Service temporarily unavailable.', status: 403 };
    case 404: return { code: 'NOT_FOUND', message: 'No results found.', status: 404 };
    case 429: return { code: 'RATE_LIMITED', message: 'Too many requests. Please wait.', status: 429, retryAfter };
    default:
      if (status >= 500) return { code: 'UPSTREAM_ERROR', message: 'Service error. Please try again.', status };
      return { code: 'INTERNAL', message: 'An unexpected error occurred.', status };
  }
}

interface TraceMoeRawResult {
  anilist: number | { id: number; idMal: number | null; title: { native: string | null; romaji: string | null; english: string | null }; synonyms: string[] };
  filename: string;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

interface TraceMoeResponse {
  frameCount: number;
  error: string;
  result: TraceMoeRawResult[];
}

function normalizeResult(raw: TraceMoeRawResult): TraceResultStored {
  const anilistInfo = typeof raw.anilist === 'object' ? raw.anilist : null;
  return {
    anilistId: anilistInfo?.id ?? (typeof raw.anilist === 'number' ? raw.anilist : 0),
    idMal: anilistInfo?.idMal ?? null,
    title: {
      romaji: anilistInfo?.title?.romaji ?? null,
      english: anilistInfo?.title?.english ?? null,
      native: anilistInfo?.title?.native ?? null,
    },
    synonyms: anilistInfo?.synonyms ?? [],
    filename: raw.filename,
    episode: raw.episode,
    from: raw.from,
    to: raw.to,
    similarity: raw.similarity,
    imageUrl: raw.image,
    videoUrl: raw.video,
  };
}

export async function searchByImage(
  imageBlob: Blob,
  options: SearchOptions
): Promise<{ results: TraceResultStored[]; frameCount: number }> {
  const params = new URLSearchParams();
  params.set('anilistInfo', '');
  if (options.cutBorders) params.set('cutBorders', '');
  if (options.anilistId) params.set('anilistID', options.anilistId.toString());

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.jpg');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${TRACE_MOE_BASE}/search?${params.toString()}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const retryAfter = res.headers.get('Retry-After') ? parseInt(res.headers.get('Retry-After')!) : undefined;
      throw mapTraceError(res.status, retryAfter);
    }

    const data: TraceMoeResponse = await res.json();
    if (data.error) {
      throw { code: 'UPSTREAM_ERROR' as const, message: data.error };
    }

    const results = (data.result || []).slice(0, 10).map(normalizeResult);
    return { results, frameCount: data.frameCount };
  } catch (err) {
    clearTimeout(timeout);
    if ((err as TracenimeError).code) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { code: 'UPSTREAM_TIMEOUT' as const, message: 'Request timed out. Please try again.' };
    }
    throw { code: 'INTERNAL' as const, message: 'An unexpected error occurred.' };
  }
}

export async function searchByUrl(
  url: string,
  options: SearchOptions
): Promise<{ results: TraceResultStored[]; frameCount: number }> {
  const params = new URLSearchParams();
  params.set('url', url);
  params.set('anilistInfo', '');
  if (options.cutBorders) params.set('cutBorders', '');
  if (options.anilistId) params.set('anilistID', options.anilistId.toString());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${TRACE_MOE_BASE}/search?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const retryAfter = res.headers.get('Retry-After') ? parseInt(res.headers.get('Retry-After')!) : undefined;
      throw mapTraceError(res.status, retryAfter);
    }

    const data: TraceMoeResponse = await res.json();
    if (data.error) {
      throw { code: 'UPSTREAM_ERROR' as const, message: data.error };
    }

    const results = (data.result || []).slice(0, 10).map(normalizeResult);
    return { results, frameCount: data.frameCount };
  } catch (err) {
    clearTimeout(timeout);
    if ((err as TracenimeError).code) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { code: 'UPSTREAM_TIMEOUT' as const, message: 'Request timed out. Please try again.' };
    }
    throw { code: 'INTERNAL' as const, message: 'An unexpected error occurred.' };
  }
}

export async function getQuota(): Promise<QuotaInfo | null> {
  try {
    const res = await fetch(`${TRACE_MOE_BASE}/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      priority: data.priority,
      concurrency: data.concurrency,
      quota: data.quota,
      quotaUsed: data.quotaUsed,
      remaining: data.quota - data.quotaUsed,
    };
  } catch {
    return null;
  }
}

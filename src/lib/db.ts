import Dexie, { type EntityTable } from 'dexie';
import type {
  SearchRecord,
  SearchCacheRecord,
  AnimeCacheRecord,
  FavoriteRecord,
  WatchlistRecord,
  SettingRecord,
} from './types';

export class TracenimeDB extends Dexie {
  searches!: EntityTable<SearchRecord, 'id'>;
  searchCache!: EntityTable<SearchCacheRecord, 'cacheKey'>;
  animeCache!: EntityTable<AnimeCacheRecord, 'anilistId'>;
  favorites!: EntityTable<FavoriteRecord, 'sceneKey'>;
  watchlist!: EntityTable<WatchlistRecord, 'anilistId'>;
  settings!: EntityTable<SettingRecord, 'key'>;

  constructor() {
    super('tracenime');
    this.version(1).stores({
      searches: 'id, createdAt, imageHash, topAnilistId',
      searchCache: 'cacheKey, cachedAt',
      animeCache: 'anilistId, fetchedAt',
      favorites: 'sceneKey, anilistId, createdAt',
      watchlist: 'anilistId, status, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new TracenimeDB();

// Repository functions
export async function addSearch(record: SearchRecord) {
  await db.searches.add(record);
  // Cap at 50
  const count = await db.searches.count();
  if (count > 50) {
    const oldest = await db.searches.orderBy('createdAt').limit(count - 50).toArray();
    await db.searches.bulkDelete(oldest.map(s => s.id));
  }
}

export async function getRecentSearches(limit = 50) {
  return db.searches.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function deleteSearch(id: string) {
  return db.searches.delete(id);
}

export async function clearAllSearches() {
  return db.searches.clear();
}

export async function getCacheEntry(cacheKey: string) {
  const entry = await db.searchCache.get(cacheKey);
  if (!entry) return null;
  // Check 30-day expiry
  if (Date.now() - entry.cachedAt > 30 * 24 * 60 * 60 * 1000) {
    await db.searchCache.delete(cacheKey);
    return null;
  }
  // Update for LRU
  await db.searchCache.update(cacheKey, { cachedAt: Date.now() });
  return entry;
}

export async function setCacheEntry(record: SearchCacheRecord) {
  await db.searchCache.put(record);
  // Cap at 200 entries (LRU)
  const count = await db.searchCache.count();
  if (count > 200) {
    const oldest = await db.searchCache.orderBy('cachedAt').limit(count - 200).toArray();
    await db.searchCache.bulkDelete(oldest.map(c => c.cacheKey));
  }
}

export async function getAnimeCache(anilistId: number) {
  const entry = await db.animeCache.get(anilistId);
  if (!entry) return null;
  const ttl = entry.status === 'RELEASING' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  if (Date.now() - entry.fetchedAt > ttl) {
    return entry; // Return stale, refresh in background
  }
  return entry;
}

export async function setAnimeCache(record: AnimeCacheRecord) {
  return db.animeCache.put(record);
}

export async function getFavorites() {
  return db.favorites.orderBy('createdAt').reverse().toArray();
}

export async function addFavorite(record: FavoriteRecord) {
  return db.favorites.put(record);
}

export async function removeFavorite(sceneKey: string) {
  return db.favorites.delete(sceneKey);
}

export async function isFavorite(sceneKey: string) {
  const f = await db.favorites.get(sceneKey);
  return !!f;
}

export async function getWatchlist() {
  return db.watchlist.orderBy('updatedAt').reverse().toArray();
}

export async function getWatchlistByStatus(status: string) {
  return db.watchlist.where('status').equals(status).reverse().sortBy('updatedAt');
}

export async function upsertWatchlist(record: WatchlistRecord) {
  return db.watchlist.put(record);
}

export async function removeWatchlist(anilistId: number) {
  return db.watchlist.delete(anilistId);
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const s = await db.settings.get(key);
  return s?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown) {
  return db.settings.put({ key, value });
}

export async function clearAllData() {
  await db.delete();
  // Reopen
  await db.open();
}

export async function getLifetimeSearchCount(): Promise<number> {
  const count = await getSetting<number>('lifetimeSearchCount');
  return count || 0;
}

export async function incrementSearchCount() {
  const current = await getLifetimeSearchCount();
  await setSetting('lifetimeSearchCount', current + 1);
}

export async function exportData() {
  const [searches, favorites, watchlist, settings] = await Promise.all([
    db.searches.toArray(),
    db.favorites.toArray(),
    db.watchlist.toArray(),
    db.settings.toArray(),
  ]);
  return {
    app: 'tracenime',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { searches, favorites, watchlist, settings },
  };
}

export async function importData(json: unknown): Promise<{ added: number; updated: number; skipped: number }> {
  const parsed = json as { app: string; schemaVersion: number; data: { searches: SearchRecord[]; favorites: FavoriteRecord[]; watchlist: WatchlistRecord[]; settings: SettingRecord[] } };
  if (parsed.app !== 'tracenime' || parsed.schemaVersion > 1) {
    throw new Error('Invalid export file');
  }
  let added = 0, updated = 0, skipped = 0;
  for (const s of parsed.data.searches || []) {
    const existing = await db.searches.get(s.id);
    if (existing) {
      if (s.createdAt > existing.createdAt) {
        await db.searches.put(s);
        updated++;
      } else skipped++;
    } else {
      await db.searches.add(s);
      added++;
    }
  }
  for (const f of parsed.data.favorites || []) {
    const existing = await db.favorites.get(f.sceneKey);
    if (existing) {
      if (f.createdAt > existing.createdAt) {
        await db.favorites.put(f);
        updated++;
      } else skipped++;
    } else {
      await db.favorites.add(f);
      added++;
    }
  }
  for (const w of parsed.data.watchlist || []) {
    const existing = await db.watchlist.get(w.anilistId);
    if (existing) {
      if (w.updatedAt > existing.updatedAt) {
        await db.watchlist.put(w);
        updated++;
      } else skipped++;
    } else {
      await db.watchlist.add(w);
      added++;
    }
  }
  for (const s of parsed.data.settings || []) {
    await db.settings.put(s);
  }
  return { added, updated, skipped };
}

import type { AnimeCacheRecord } from './types';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

function sanitizeHtml(html: string | null): string | null {
  if (!html) return null;
  // Allow only br, i, b, em, strong tags
  return html.replace(/<(?!\/?(?:br|i|b|em|strong)\b)[^>]*>/gi, '');
}

const MEDIA_DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    siteUrl
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
      color
    }
    genres
    description(asHtml: false)
    episodes
    status
    season
    seasonYear
    nextAiringEpisode {
      episode
      airingAt
      timeUntilAiring
    }
    externalLinks {
      site
      url
      type
      icon
    }
  }
}
`;

const MEDIA_BATCH_QUERY = `
query ($ids: [Int], $perPage: Int) {
  Page(perPage: $perPage) {
    media(id_in: $ids, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
      }
      status
      episodes
      nextAiringEpisode {
        episode
        airingAt
      }
    }
  }
}
`;

export async function fetchAnimeDetails(anilistId: number): Promise<AnimeCacheRecord | null> {
  try {
    const res = await fetch(ANILIST_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: MEDIA_DETAILS_QUERY,
        variables: { id: anilistId },
      }),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      if (res.status === 429) throw { code: 'RATE_LIMITED', message: 'AniList rate limit reached.' };
      return null;
    }

    const json = await res.json();
    const media = json.data?.Media;
    if (!media) return null;

    const streamingLinks = (media.externalLinks || [])
      .filter((l: { type: string }) => l.type === 'STREAMING')
      .map((l: { site: string; url: string; icon: string | null }) => ({
        site: l.site,
        url: l.url,
        icon: l.icon || null,
      }));

    return {
      anilistId: media.id,
      idMal: media.idMal || null,
      title: {
        romaji: media.title?.romaji || null,
        english: media.title?.english || null,
        native: media.title?.native || null,
      },
      coverUrl: media.coverImage?.large || null,
      coverColor: media.coverImage?.color || null,
      genres: media.genres || [],
      description: sanitizeHtml(media.description),
      episodes: media.episodes || null,
      status: media.status || null,
      season: media.season || null,
      seasonYear: media.seasonYear || null,
      nextAiring: media.nextAiringEpisode
        ? { episode: media.nextAiringEpisode.episode, airingAt: media.nextAiringEpisode.airingAt }
        : null,
      streamingLinks,
      siteUrl: media.siteUrl || `https://anilist.co/anime/${media.id}`,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    if ((err as { code: string }).code) throw err;
    return null;
  }
}

export async function fetchAnimeBatch(ids: number[]): Promise<AnimeCacheRecord[]> {
  if (ids.length === 0) return [];
  try {
    const res = await fetch(ANILIST_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: MEDIA_BATCH_QUERY,
        variables: { ids, perPage: ids.length },
      }),
    });

    if (!res.ok) return [];

    const json = await res.json();
    const mediaList = json.data?.Page?.media || [];

    return mediaList.map((m: {
      id: number;
      title: { romaji: string | null; english: string | null; native: string | null };
      coverImage: { large: string | null };
      status: string | null;
      episodes: number | null;
      nextAiringEpisode: { episode: number; airingAt: number } | null;
    }) => ({
      anilistId: m.id,
      idMal: null,
      title: { romaji: m.title?.romaji || null, english: m.title?.english || null, native: m.title?.native || null },
      coverUrl: m.coverImage?.large || null,
      coverColor: null,
      genres: [],
      description: null,
      episodes: m.episodes || null,
      status: m.status || null,
      season: null,
      seasonYear: null,
      nextAiring: m.nextAiringEpisode ? { episode: m.nextAiringEpisode.episode, airingAt: m.nextAiringEpisode.airingAt } : null,
      streamingLinks: [],
      siteUrl: `https://anilist.co/anime/${m.id}`,
      fetchedAt: Date.now(),
    }));
  } catch {
    return [];
  }
}

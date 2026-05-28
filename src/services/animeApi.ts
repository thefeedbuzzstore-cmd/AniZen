const BASE_URL = "https://api.jikan.moe/v4";

export interface Anime {
  mal_id: number;
  title: string;
  title_english: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  trailer: {
    youtube_id: string;
    url: string;
    embed_url: string;
  };
  score: number;
  synopsis: string;
  episodes: number;
  status: string;
  genres: Array<{ name: string }>;
  year: number;
  season: string;
}

// Memory caching layer
const apiCache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache expiry

const inFlightRequests: Record<string, Promise<any>> = {};

function getCached<T>(key: string): T | null {
  const cached = apiCache[key];
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  return null;
}

function setCached(key: string, data: any) {
  apiCache[key] = {
    data,
    expiry: Date.now() + CACHE_TTL
  };
}

async function fetchWithDedupe<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  if (inFlightRequests[key]) {
    return inFlightRequests[key] as Promise<T>;
  }

  const promise = fetchFn().then((res) => {
    delete inFlightRequests[key];
    setCached(key, res);
    return res;
  }).catch((err) => {
    delete inFlightRequests[key];
    throw err;
  });

  inFlightRequests[key] = promise;
  return promise;
}

export async function getTopAnime() {
  const url = `${BASE_URL}/top/anime`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return (retryData.data || []) as Anime[];
    }
    const data = await res.json();
    return (data.data || []) as Anime[];
  });
}

export async function getRecentAnime() {
  const url = `${BASE_URL}/seasons/now`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return (retryData.data || []) as Anime[];
    }
    const data = await res.json();
    return (data.data || []) as Anime[];
  });
}

export async function getAnimeById(id: number) {
  const url = `${BASE_URL}/anime/${id}/full`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return retryData.data as Anime;
    }
    const data = await res.json();
    return data.data as Anime;
  });
}

export interface SearchOptions {
  q?: string;
  genres?: string;
  season?: string;
  year?: string;
  status?: string;
  rating?: string;
  min_score?: string;
  order_by?: string;
  sort?: string;
}

export async function searchAnime(options: SearchOptions | string) {
  let url = `${BASE_URL}/anime?limit=24`;
  
  if (typeof options === "string") {
    url += `&q=${options}`;
  } else {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const queryString = params.toString();
    if (queryString) url += `&${queryString}`;
  }

  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return (retryData.data || []) as Anime[];
    }
    const data = await res.json();
    return (data.data || []) as Anime[];
  });
}

export async function getAnimeCharacters(id: number) {
  const url = `${BASE_URL}/anime/${id}/characters`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return retryData.data || [];
    }
    const data = await res.json();
    return data.data || [];
  });
}

export async function getAnimeRecommendations(id: number) {
  const url = `${BASE_URL}/anime/${id}/recommendations`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return retryData.data || [];
    }
    const data = await res.json();
    return data.data || [];
  });
}

export async function getGenres() {
  const url = `${BASE_URL}/genres/anime`;
  return fetchWithDedupe(url, async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const stale = apiCache[url]?.data;
      if (stale) return stale;
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await fetch(url);
      const retryData = await retryRes.json();
      return retryData.data || [];
    }
    const data = await res.json();
    return data.data || [];
  });
}

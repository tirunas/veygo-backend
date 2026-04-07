import { Injectable, Logger } from '@nestjs/common';

export interface WikiResult {
  photos: string[];
  descriptionEn: string | null;
}

const USER_AGENT = 'VeygoBot/1.0 (travel planning app; contact@veygo.lt)';
const WP_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

// Patterns to exclude non-photo images (logos, maps, icons, flags, diagrams)
const EXCLUDED_PATTERNS = [
  /map/i, /flag/i, /logo/i, /icon/i, /coat.of.arms/i, /emblem/i,
  /seal/i, /banner/i, /stub/i, /pictogram/i, /sign/i, /symbol/i,
  /diagram/i, /chart/i, /graph/i, /plan/i, /schematic/i,
  /\.svg$/i, /commons-logo/i, /wikimedia/i, /wikipedia/i,
];

const MIN_WIDTH = 400;
const THUMB_WIDTH = '1600';

interface ImageInfo {
  url: string;
  width: number;
  height: number;
}

@Injectable()
export class WikiStep {
  private readonly logger = new Logger(WikiStep.name);

  async fetchWikiData(placeName: string): Promise<WikiResult> {
    const [articlePhotos, commonsPhotos, descriptionEn] = await Promise.allSettled([
      this.fetchArticlePhotos(placeName),
      this.fetchCommonsPhotos(placeName),
      this.fetchDescription(placeName),
    ]);

    const allPhotos = [
      ...(articlePhotos.status === 'fulfilled' ? articlePhotos.value : []),
      ...(commonsPhotos.status === 'fulfilled' ? commonsPhotos.value : []),
    ];

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allPhotos.filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    this.logger.log(`WikiStep: ${unique.length} photos for "${placeName}"`);

    return {
      photos: unique,
      descriptionEn: descriptionEn.status === 'fulfilled' ? descriptionEn.value : null,
    };
  }

  private isExcluded(filename: string): boolean {
    return EXCLUDED_PATTERNS.some((pattern) => pattern.test(filename));
  }

  /**
   * Fetches all images listed in a Wikipedia article, resolves their full URLs,
   * and filters for high-quality landscape photos.
   */
  private async fetchArticlePhotos(placeName: string): Promise<string[]> {
    // Step 1: Get list of image titles in the article
    const listParams = new URLSearchParams({
      action: 'query',
      titles: placeName,
      prop: 'images',
      imlimit: '100',
      format: 'json',
      origin: '*',
    });

    const listRes = await fetch(`${WP_API}?${listParams}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!listRes.ok) return [];

    const listData = await listRes.json() as {
      query?: { pages?: Record<string, { images?: Array<{ title: string }> }> };
    };

    const pages = Object.values(listData.query?.pages ?? {});
    const imageTitles = pages
      .flatMap((p) => p.images ?? [])
      .map((img) => img.title)
      .filter((title) => !this.isExcluded(title));

    if (imageTitles.length === 0) return [];

    // Step 2: Batch resolve URLs (max 50 per request)
    const batch = imageTitles.slice(0, 50);
    return this.resolveImageUrls(batch, WP_API);
  }

  /**
   * Searches Wikimedia Commons for photos of the place by category and free-text.
   */
  private async fetchCommonsPhotos(placeName: string): Promise<string[]> {
    // Try category search first (most curated)
    const catParams = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${placeName}`,
      cmtype: 'file',
      cmlimit: '30',
      format: 'json',
      origin: '*',
    });

    const catRes = await fetch(`${COMMONS_API}?${catParams}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    let titles: string[] = [];

    if (catRes.ok) {
      const catData = await catRes.json() as {
        query?: { categorymembers?: Array<{ title: string }> };
      };
      titles = (catData.query?.categorymembers ?? [])
        .map((m) => m.title)
        .filter((t) => !this.isExcluded(t));
    }

    // If category gives too few results, also try free-text search
    if (titles.length < 8) {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `${placeName} photograph`,
        srnamespace: '6',
        srlimit: '30',
        format: 'json',
        origin: '*',
      });

      const searchRes = await fetch(`${COMMONS_API}?${searchParams}`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json() as {
          query?: { search?: Array<{ title: string }> };
        };
        const searchTitles = (searchData.query?.search ?? [])
          .map((r) => r.title)
          .filter((t) => !this.isExcluded(t));
        titles = [...titles, ...searchTitles];
      }
    }

    // Second pass: search by place name alone for more angles
    if (titles.length < 10) {
      const searchParams2 = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: placeName,
        srnamespace: '6',
        srlimit: '20',
        format: 'json',
        origin: '*',
      });

      const searchRes2 = await fetch(`${COMMONS_API}?${searchParams2}`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (searchRes2.ok) {
        const searchData2 = await searchRes2.json() as {
          query?: { search?: Array<{ title: string }> };
        };
        const more = (searchData2.query?.search ?? [])
          .map((r) => r.title)
          .filter((t) => !this.isExcluded(t));
        titles = [...new Set([...titles, ...more])];
      }
    }

    if (titles.length === 0) return [];

    const batch = titles.slice(0, 40);
    return this.resolveImageUrls(batch, COMMONS_API);
  }

  private async resolveImageUrls(titles: string[], apiBase: string): Promise<string[]> {
    if (titles.length === 0) return [];

    const params = new URLSearchParams({
      action: 'query',
      titles: titles.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size',
      iiurlwidth: THUMB_WIDTH,
      format: 'json',
      origin: '*',
    });

    const res = await fetch(`${apiBase}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) return [];

    const data = await res.json() as {
      query?: {
        pages?: Record<string, {
          title?: string;
          imageinfo?: Array<ImageInfo>;
        }>;
      };
    };

    const urls: string[] = [];

    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;

      // Skip non-photo formats
      const url = info.url;
      if (/\.svg$/i.test(url) || /\.gif$/i.test(url)) continue;

      // Skip tiny images (icons, thumbnails)
      if (info.width && info.width < MIN_WIDTH) continue;

      // Prefer landscape orientation
      urls.push(url);
    }

    return urls;
  }

  private async fetchDescription(placeName: string): Promise<string | null> {
    const params = new URLSearchParams({
      action: 'query',
      titles: placeName,
      prop: 'extracts',
      exintro: 'true',
      explaintext: 'true',
      exsentences: '4',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${WP_API}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      query?: { pages?: Record<string, { extract?: string }> };
    };

    const pages = Object.values(data.query?.pages ?? {});
    const extract = pages[0]?.extract?.trim();

    return extract && extract.length > 30 ? extract : null;
  }
}

import { Injectable, Logger } from '@nestjs/common';

export interface SourceResult {
  source: string;
  snippets: string[];
  photos: string[];
  reliability: number;
}

export interface ResearchBundle {
  placeName: string;
  destinationName: string;
  sources: SourceResult[];
  wikiDescription: string | null;
  wikiPhotos: string[];
  flickrPhotos: string[];
}

const USER_AGENT = 'VeygoBot/1.0 (travel planning app)';
const REQUEST_TIMEOUT = 12_000;

@Injectable()
export class ResearchStep {
  private readonly logger = new Logger(ResearchStep.name);

  async research(
    placeName: string,
    destinationName: string,
    jobId: string,
    logFn: (msg: string) => void,
    wikiDescription: string | null,
    wikiPhotos: string[],
  ): Promise<ResearchBundle> {
    logFn(`  → Reddit, Atlas Obscura, Wikivoyage, YouTube, blogs, Flickr: parallel fetch...`);

    const [reddit, atlasObscura, wikivoyage, youtube, blogs, flickr] = await Promise.allSettled([
      this.fetchReddit(placeName, destinationName, logFn),
      this.fetchAtlasObscura(placeName, destinationName, logFn),
      this.fetchWikivoyage(placeName, destinationName, logFn),
      this.fetchYoutube(placeName, destinationName, logFn),
      this.fetchBlogs(placeName, destinationName, logFn),
      this.fetchFlickr(placeName, destinationName, logFn),
    ]);

    const sources: SourceResult[] = [];
    const flickrPhotos: string[] = [];

    if (reddit.status === 'fulfilled') sources.push(reddit.value);
    else logFn(`  ✗ Reddit: failed (skipped)`);

    if (atlasObscura.status === 'fulfilled') sources.push(atlasObscura.value);
    else logFn(`  ✗ Atlas Obscura: failed (skipped)`);

    if (wikivoyage.status === 'fulfilled') sources.push(wikivoyage.value);
    else logFn(`  ✗ Wikivoyage: failed (skipped)`);

    if (youtube.status === 'fulfilled') sources.push(youtube.value);
    else logFn(`  ✗ YouTube: failed (skipped)`);

    if (blogs.status === 'fulfilled') sources.push(blogs.value);
    else logFn(`  ✗ Blogs: failed (skipped)`);

    if (flickr.status === 'fulfilled') {
      flickrPhotos.push(...flickr.value.photos);
      if (flickr.value.snippets.length || flickr.value.photos.length) {
        sources.push(flickr.value);
      }
    } else {
      logFn(`  ✗ Flickr: failed (skipped)`);
    }

    const sourceCount = sources.length;
    const photoCount = flickrPhotos.length + wikiPhotos.length;
    logFn(`  ✓ Research complete: ${sourceCount} sources, ${photoCount} photos`);

    return {
      placeName,
      destinationName,
      sources,
      wikiDescription,
      wikiPhotos,
      flickrPhotos,
    };
  }

  private async fetchReddit(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → Reddit: searching r/${destinationName.toLowerCase().replace(/\s+/g, '')} + r/travel...`);

    const queries = [
      `"${placeName}" ${destinationName}`,
      `${placeName} tips`,
    ];

    const snippets: string[] = [];
    const seen = new Set<string>();
    let topScore = 0;
    let totalPosts = 0;

    for (const query of queries) {
      try {
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=10&type=link`;
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        if (!res.ok) continue;

        const data = await res.json() as {
          data?: { children?: Array<{ data: { id: string; title: string; selftext: string; score: number } }> };
        };

        for (const child of data.data?.children ?? []) {
          const post = child.data;
          if (post.score < 10) continue;
          if (seen.has(post.id)) continue;
          seen.add(post.id);
          totalPosts++;
          if (post.score > topScore) topScore = post.score;

          const text = post.selftext.replace(/\n+/g, ' ').trim();
          if (text.length > 80) {
            snippets.push(`[Reddit] "${post.title}": ${text.slice(0, 500)}`);
          } else if (post.title.length > 20) {
            snippets.push(`[Reddit] ${post.title}`);
          }
        }
      } catch {
        // silently skip
      }
    }

    const scoreStr = topScore > 0 ? ` (top score: ${topScore > 999 ? (topScore / 1000).toFixed(1) + 'k' : topScore})` : '';
    logFn(`  ✓ Reddit: ${totalPosts} posts${scoreStr}`);

    return { source: 'reddit', snippets: snippets.slice(0, 8), photos: [], reliability: 0.8 };
  }

  private async fetchAtlasObscura(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → Atlas Obscura: searching...`);

    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(`site:atlasobscura.com "${placeName}"`)}&format=json&no_html=1&skip_disambig=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    const snippets: string[] = [];

    if (searchRes.ok) {
      const data = await searchRes.json() as {
        AbstractURL?: string;
        AbstractText?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      };

      if (data.AbstractText && data.AbstractText.length > 50) {
        snippets.push(`[Atlas Obscura] ${data.AbstractText.slice(0, 600)}`);
      }

      const aoUrl = data.AbstractURL || (data.RelatedTopics?.[0]?.FirstURL ?? '');
      if (aoUrl && aoUrl.includes('atlasobscura.com')) {
        try {
          const pageRes = await fetch(aoUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VeygoBot/1.0)' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
          });
          if (pageRes.ok) {
            const html = await pageRes.text();
            const descMatch = html.match(/<div[^>]*class="[^"]*body-copy[^"]*"[^>]*>([\s\S]{100,2000}?)<\/div>/i);
            if (descMatch) {
              const text = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (text.length > 100) {
                snippets.push(`[Atlas Obscura full] ${text.slice(0, 800)}`);
              }
            }
            const knowMatch = html.match(/know before you go[\s\S]{0,2000}?(<p[\s\S]{50,500}?<\/p>)/i);
            if (knowMatch) {
              const text = knowMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (text.length > 30) {
                snippets.push(`[Atlas Obscura tips] ${text.slice(0, 400)}`);
              }
            }
          }
        } catch {
          // page scrape failed, that's OK
        }
      }
    }

    const charCount = snippets.reduce((sum, s) => sum + s.length, 0);
    if (snippets.length > 0) {
      logFn(`  ✓ Atlas Obscura: entry found (${charCount} chars)`);
    } else {
      logFn(`  ✓ Atlas Obscura: no entry found`);
    }

    return { source: 'atlasobscura', snippets, photos: [], reliability: 0.85 };
  }

  private async fetchWikivoyage(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → Wikivoyage: fetching destination article...`);

    const params = new URLSearchParams({
      action: 'query',
      titles: destinationName,
      prop: 'extracts',
      exintro: 'false',
      explaintext: 'true',
      exsectionformat: 'plain',
      format: 'json',
      origin: '*',
    });

    const res = await fetch(`https://en.wikivoyage.org/w/api.php?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    const snippets: string[] = [];

    if (res.ok) {
      const data = await res.json() as {
        query?: { pages?: Record<string, { extract?: string }> };
      };
      const extract = Object.values(data.query?.pages ?? {})[0]?.extract ?? '';

      if (extract.length > 100) {
        const lines = extract.split('\n').filter((l) => l.trim().length > 40);
        const placeNameLower = placeName.toLowerCase();
        const mentions = lines.filter((l) => l.toLowerCase().includes(placeNameLower));

        for (const mention of mentions.slice(0, 5)) {
          snippets.push(`[Wikivoyage] ${mention.trim().slice(0, 400)}`);
        }

        const seeDoMatch = extract.match(/(?:^|\n)(See|Do)\n([\s\S]{100,1500}?)(?=\n[A-Z]|\n\n[A-Z]|$)/);
        if (seeDoMatch && mentions.length === 0) {
          snippets.push(`[Wikivoyage ${seeDoMatch[1]}] ${seeDoMatch[2].trim().slice(0, 600)}`);
        }
      }
    }

    logFn(`  ✓ Wikivoyage: ${snippets.length} mentions`);
    return { source: 'wikivoyage', snippets, photos: [], reliability: 0.75 };
  }

  private async fetchYoutube(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → YouTube: searching videos...`);

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      logFn(`  ✓ YouTube: skipped (no YOUTUBE_API_KEY)`);
      return { source: 'youtube', snippets: [], photos: [], reliability: 0.7 };
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: `"${placeName}" ${destinationName}`,
      type: 'video',
      maxResults: '5',
      order: 'relevance',
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    const snippets: string[] = [];

    if (res.ok) {
      const data = await res.json() as {
        items?: Array<{ snippet: { title: string; description: string } }>;
      };

      for (const item of data.items ?? []) {
        const title = item.snippet.title;
        const desc = item.snippet.description.replace(/\n+/g, ' ').trim();
        if (title) {
          snippets.push(`[YouTube] "${title}"${desc.length > 30 ? `: ${desc.slice(0, 200)}` : ''}`);
        }
      }
    }

    logFn(`  ✓ YouTube: ${snippets.length} videos`);
    return { source: 'youtube', snippets, photos: [], reliability: 0.7 };
  }

  private async fetchBlogs(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → Blogs: DDG search across travel sites...`);

    const query = `"${placeName}" "${destinationName}" tips site:nomadicmatt.com OR site:timeout.com OR site:lonelyplanet.com`;
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const snippets: string[] = [];

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (res.ok) {
        const data = await res.json() as {
          AbstractText?: string;
          RelatedTopics?: Array<{ Text?: string }>;
        };

        if (data.AbstractText && data.AbstractText.length > 60) {
          snippets.push(`[Travel blog] ${data.AbstractText.slice(0, 500)}`);
        }
        for (const topic of (data.RelatedTopics ?? []).slice(0, 3)) {
          if (topic.Text && topic.Text.length > 40) {
            snippets.push(`[Travel blog] ${topic.Text.slice(0, 300)}`);
          }
        }
      }
    } catch {
      // timeout or network error — silently skip
    }

    logFn(`  ✓ Blogs: ${snippets.length} snippets`);
    return { source: 'blogs', snippets, photos: [], reliability: 0.65 };
  }

  private async fetchFlickr(
    placeName: string,
    destinationName: string,
    logFn: (msg: string) => void,
  ): Promise<SourceResult> {
    logFn(`  → Flickr: searching CC-licensed photos...`);

    const apiKey = process.env.FLICKR_API_KEY;
    if (!apiKey) {
      logFn(`  ✓ Flickr: skipped (no FLICKR_API_KEY)`);
      return { source: 'flickr', snippets: [], photos: [], reliability: 0.6 };
    }

    const params = new URLSearchParams({
      method: 'flickr.photos.search',
      api_key: apiKey,
      text: `${placeName} ${destinationName}`,
      license: '1,2,4,5,6,9,10',
      sort: 'relevance',
      per_page: '8',
      extras: 'url_m,url_l,title',
      format: 'json',
      nojsoncallback: '1',
    });

    const photos: string[] = [];

    try {
      const res = await fetch(`https://www.flickr.com/services/rest/?${params}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (res.ok) {
        const data = await res.json() as {
          photos?: { photo?: Array<{ url_l?: string; url_m?: string; title?: string }> };
        };

        for (const photo of data.photos?.photo ?? []) {
          const url = photo.url_l ?? photo.url_m;
          if (url) photos.push(url);
        }
      }
    } catch {
      // silently skip
    }

    logFn(`  ✓ Flickr: ${photos.length} photos`);
    return { source: 'flickr', snippets: [], photos, reliability: 0.6 };
  }
}

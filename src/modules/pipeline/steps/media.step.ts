import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MediaResult {
  youtubeLinks: string[];
  instagramLinks: string[];
}

@Injectable()
export class MediaStep {
  private readonly logger = new Logger(MediaStep.name);

  constructor(private readonly configService: ConfigService) {}

  async findMedia(placeName: string, destinationName: string): Promise<MediaResult> {
    const [youtubeLinks, instagramLinks] = await Promise.allSettled([
      this.findYoutubeVideos(placeName, destinationName),
      this.findInstagramLinks(placeName, destinationName),
    ]);

    return {
      youtubeLinks: youtubeLinks.status === 'fulfilled' ? youtubeLinks.value : [],
      instagramLinks: instagramLinks.status === 'fulfilled' ? instagramLinks.value : [],
    };
  }

  private async findYoutubeVideos(placeName: string, destinationName: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!apiKey) {
      this.logger.warn('YOUTUBE_API_KEY not set — skipping YouTube search');
      return [];
    }

    const query = `${placeName} ${destinationName} travel`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      this.logger.warn(`YouTube API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      items?: Array<{ id: { videoId?: string } }>;
    };

    return (data.items ?? [])
      .map((item) => item.id.videoId)
      .filter((id): id is string => Boolean(id))
      .map((id) => `https://www.youtube.com/watch?v=${id}`);
  }

  private async findInstagramLinks(placeName: string, destinationName: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('BRAVE_SEARCH_API_KEY');

    if (!apiKey) {
      this.logger.warn('BRAVE_SEARCH_API_KEY not set — skipping Instagram search');
      return [];
    }

    const query = `site:instagram.com ${placeName} ${destinationName}`;
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as {
      web?: { results?: Array<{ url: string }> };
    };

    return (data.web?.results ?? [])
      .map((r) => r.url)
      .filter((url) => url.includes('instagram.com'))
      .slice(0, 3);
  }
}

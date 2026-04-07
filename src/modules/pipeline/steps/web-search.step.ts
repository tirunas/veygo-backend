import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DiscoveredPlace {
  name: string;
}

@Injectable()
export class WebSearchStep {
  private readonly logger = new Logger(WebSearchStep.name);

  constructor(private readonly configService: ConfigService) {}

  async discover(destinationName: string, type: 'attraction' | 'restaurant'): Promise<DiscoveredPlace[]> {
    const apiKey = this.configService.get<string>('BRAVE_SEARCH_API_KEY');

    if (!apiKey) {
      this.logger.warn('BRAVE_SEARCH_API_KEY not set — using mock discovery');
      return this.mockDiscover(destinationName, type);
    }

    const typeLabel = type === 'attraction' ? 'top tourist attractions' : 'best restaurants';
    const query = `${typeLabel} in ${destinationName}`;

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      web?: { results?: Array<{ title: string; description?: string }> };
    };

    const results = data.web?.results ?? [];
    const names = results
      .map((r) => r.title.split(' - ')[0].split(' | ')[0].trim())
      .filter((name) => name.length > 2 && name.length < 100)
      .slice(0, 10);

    this.logger.log(`Discovered ${names.length} ${type}s for ${destinationName}`);
    return names.map((name) => ({ name }));
  }

  private mockDiscover(destinationName: string, type: 'attraction' | 'restaurant'): DiscoveredPlace[] {
    if (type === 'attraction') {
      return [
        { name: `${destinationName} Old Town` },
        { name: `${destinationName} Cathedral` },
        { name: `${destinationName} National Museum` },
      ];
    }
    return [
      { name: `${destinationName} Central Restaurant` },
      { name: `${destinationName} Bistro` },
    ];
  }
}

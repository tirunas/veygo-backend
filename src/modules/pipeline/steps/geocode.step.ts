import { Injectable, Logger } from '@nestjs/common';

export interface GeocodedPlace {
  sourceId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
}

// Nominatim requires max 1 request per second
const NOMINATIM_DELAY_MS = 1200;
const USER_AGENT = 'VeygoBot/1.0 (travel planning app)';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

@Injectable()
export class GeocodeStep {
  private readonly logger = new Logger(GeocodeStep.name);

  async fetchDetails(placeName: string, locationContext: string): Promise<GeocodedPlace | null> {
    await this.delay(NOMINATIM_DELAY_MS);

    const query = `${placeName}, ${locationContext}`;
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      this.logger.warn(`Nominatim error for "${placeName}": ${response.status}`);
      return null;
    }

    const data = await response.json() as Array<{
      osm_type: string;
      osm_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    if (!data.length) {
      this.logger.warn(`No geocode result for: "${query}"`);
      return null;
    }

    const result = data[0];
    this.logger.debug(`Geocoded "${placeName}" → ${result.lat},${result.lon}`);

    return {
      sourceId: `${result.osm_type}-${result.osm_id}`,
      name: placeName,
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

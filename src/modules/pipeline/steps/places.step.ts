import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceDetails {
  googlePlaceId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  openingHours: string | null;
  photos: string[];
}

const PLACES_DELAY_MS = 500;

@Injectable()
export class PlacesStep {
  private readonly logger = new Logger(PlacesStep.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchDetails(placeName: string, locationContext: string): Promise<PlaceDetails | null> {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_PLACES_API_KEY not set — using mock place details');
      return this.mockDetails(placeName);
    }

    await this.delay(PLACES_DELAY_MS);

    const placeId = await this.textSearch(placeName, locationContext, apiKey);
    if (!placeId) {
      this.logger.warn(`No place found for: ${placeName}`);
      return null;
    }

    return this.placeDetails(placeId, placeName, apiKey);
  }

  private async textSearch(name: string, location: string, apiKey: string): Promise<string | null> {
    const query = `${name} ${location}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json() as {
      results?: Array<{ place_id: string }>;
    };

    return data.results?.[0]?.place_id ?? null;
  }

  private async placeDetails(placeId: string, fallbackName: string, apiKey: string): Promise<PlaceDetails> {
    const fields = 'place_id,name,formatted_address,geometry,rating,opening_hours,photos';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json() as {
      result?: {
        place_id: string;
        name?: string;
        formatted_address?: string;
        geometry?: { location: { lat: number; lng: number } };
        rating?: number;
        opening_hours?: { weekday_text?: string[] };
        photos?: Array<{ photo_reference: string }>;
      };
    };

    const result = data.result;
    if (!result) {
      return { googlePlaceId: placeId, name: fallbackName, address: null, lat: null, lng: null, rating: null, openingHours: null, photos: [] };
    }

    const photos = (result.photos ?? []).slice(0, 5).map(
      (p) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`,
    );

    return {
      googlePlaceId: result.place_id,
      name: result.name ?? fallbackName,
      address: result.formatted_address ?? null,
      lat: result.geometry?.location.lat ?? null,
      lng: result.geometry?.location.lng ?? null,
      rating: result.rating ?? null,
      openingHours: result.opening_hours?.weekday_text?.join('; ') ?? null,
      photos,
    };
  }

  private mockDetails(name: string): PlaceDetails {
    return {
      googlePlaceId: `mock-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      address: '123 Mock Street',
      lat: 54.6872 + Math.random() * 0.1,
      lng: 25.2797 + Math.random() * 0.1,
      rating: 4.2,
      openingHours: 'Mon-Sun 09:00-18:00',
      photos: [],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

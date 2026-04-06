export interface AttractionContent {
  hook?: string;
  tip?: string;
  tickets?: unknown;
  crowd?: unknown[];
  photos?: string[];
  nearbyFood?: { name: string; type: string; distance: string }[];
  [key: string]: unknown;
}

export interface Attraction {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  priceAndDuration: string;
  img: string;
  category: 'popular' | 'gem';
  lat: number;
  lng: number;
  openingHours?: string | null;
  bestTime?: string | null;
  source?: string | null;
  content: AttractionContent;
  location: { lat: number; lng: number };
  hook?: string;
  tip?: string;
  tickets?: unknown;
  crowd?: unknown[];
  photos?: string[];
  nearbyFood?: { name: string; type: string; distance: string }[];
}

export interface AttractionPin {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  category: string;
  img: string;
}

export interface CreateAttractionInput {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  priceAndDuration: string;
  img: string;
  category: 'popular' | 'gem';
  lat: number;
  lng: number;
  openingHours?: string;
  bestTime?: string;
  source?: string;
  content?: AttractionContent;
}

export interface UpdateAttractionInput {
  name?: string;
  description?: string;
  priceAndDuration?: string;
  img?: string;
  category?: 'popular' | 'gem';
  lat?: number;
  lng?: number;
  openingHours?: string;
  bestTime?: string;
  source?: string;
  content?: AttractionContent;
}

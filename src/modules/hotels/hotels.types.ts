export interface HotelContent {
  highlights?: string[];
  amenities?: string[];
  walkTo?: Record<string, string>;
  roomTypes?: string[];
  [key: string]: unknown;
}

export interface Hotel {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  tier: 'budget' | 'mid' | 'comfort';
  area: string;
  pricePerNight: number;
  rating: string;
  img: string;
  lat: number;
  lng: number;
  source?: string | null;
  highlights?: string[];
  amenities?: string[];
  walkTo?: Record<string, string>;
  roomTypes?: string[];
}

export interface HotelPin {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  tier: 'budget' | 'mid' | 'comfort';
  pricePerNight: number;
}

export interface CreateHotelInput {
  id: string;
  destinationId?: string; // ignored by repository
  name: string;
  tier: 'budget' | 'mid' | 'comfort';
  area: string;
  pricePerNight: number;
  rating: string;
  img: string;
  lat: number;
  lng: number;
  source?: string;
  content?: HotelContent;
}

export interface UpdateHotelInput {
  name?: string;
  tier?: 'budget' | 'mid' | 'comfort';
  area?: string;
  pricePerNight?: number;
  rating?: string;
  img?: string;
  lat?: number;
  lng?: number;
  source?: string;
  content?: HotelContent;
}

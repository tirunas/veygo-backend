export interface Hotel {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  tier: 'budget' | 'mid' | 'comfort';
  area: string;
  pricePerNight: number;
  rating: string;
  img: string;
  highlights: string[];
  amenities: string[];
  roomTypes: string[];
  walkTo: Record<string, string>;
  source: string | null;
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
  name: string;
  tier: 'budget' | 'mid' | 'comfort';
  area: string;
  pricePerNight: number;
  rating: string;
  img: string;
  lat: number;
  lng: number;
  highlights?: string[];
  amenities?: string[];
  roomTypes?: string[];
  walkTo?: Record<string, string>;
  source?: string;
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
  highlights?: string[];
  amenities?: string[];
  roomTypes?: string[];
  walkTo?: Record<string, string>;
  source?: string;
}

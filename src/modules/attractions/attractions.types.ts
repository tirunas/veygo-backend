export interface NearbyFood {
  id: string;
  name: string;
  type: string;
  price: string;
  distance: number;
}

export interface Attraction {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  priceAndDuration: string | null;
  img: string;
  category: 'popular' | 'gem';
  lat: number;
  lng: number;
  hook: string | null;
  tip: string | null;
  nearbyFoodRadiusKm: number;
  openingHours: string | null;
  bestTime: string | null;
  source: string | null;
  location: { lat: number; lng: number };
  nearbyFood: NearbyFood[];
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
  img: string;
  category: 'popular' | 'gem';
  lat: number;
  lng: number;
  hook?: string;
  tip?: string;
  nearbyFoodRadiusKm?: number;
  priceAndDuration?: string;
  openingHours?: string;
  bestTime?: string;
  source?: string;
}

export interface UpdateAttractionInput {
  name?: string;
  description?: string;
  img?: string;
  category?: 'popular' | 'gem';
  lat?: number;
  lng?: number;
  hook?: string;
  tip?: string;
  nearbyFoodRadiusKm?: number;
  priceAndDuration?: string;
  openingHours?: string;
  bestTime?: string;
  source?: string;
}

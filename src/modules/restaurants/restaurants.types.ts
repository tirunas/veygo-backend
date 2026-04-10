export interface Review {
  text: string;
  author: string;
  rating: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  price: string;
  type: string;
  cuisine: string | null;
  img: string | null;
  lat: number;
  lng: number;
  openingHours: string | null;
  delivery: boolean;
  petFriendly: boolean;
  signature: string | null;
  reviews: Review[];
  source: string | null;
  location: { lat: number; lng: number };
}

export interface RestaurantPin {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  type: string;
  price: string;
}

export interface CreateRestaurantInput {
  id: string;
  destinationId?: string; // ignored by repository
  name: string;
  type: string;
  price: string;
  lat: number;
  lng: number;
  cuisine?: string;
  description?: string;
  signature?: string;
  reviews?: Review[];
  img?: string;
  openingHours?: string;
  delivery?: boolean;
  petFriendly?: boolean;
  source?: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  type?: string;
  price?: string;
  lat?: number;
  lng?: number;
  cuisine?: string;
  description?: string;
  signature?: string;
  reviews?: Review[];
  img?: string;
  openingHours?: string;
  delivery?: boolean;
  petFriendly?: boolean;
  source?: string;
}

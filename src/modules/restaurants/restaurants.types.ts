export interface Restaurant {
  id: string;
  name: string;
  description: string;
  price: string;
  type: string;
  img?: string | null;
  lat: number;
  lng: number;
  openingHours?: string | null;
  delivery?: boolean;
  deliveryUrl?: string | null;
  petFriendly?: boolean;
  source?: string | null;
  location: { lat: number; lng: number };
  signature?: string;
  reviews?: { text: string; author: string; rating: string }[];
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
  description: string;
  price: string;
  type: string;
  img?: string;
  lat: number;
  lng: number;
  openingHours?: string;
  delivery?: boolean;
  deliveryUrl?: string;
  petFriendly?: boolean;
  source?: string;
  signature?: string;
  reviews?: { text: string; author: string; rating: string }[];
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string;
  price?: string;
  type?: string;
  img?: string;
  lat?: number;
  lng?: number;
  openingHours?: string;
  delivery?: boolean;
  deliveryUrl?: string;
  petFriendly?: boolean;
  source?: string;
  signature?: string;
  reviews?: { text: string; author: string; rating: string }[];
}

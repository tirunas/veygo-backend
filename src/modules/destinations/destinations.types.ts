export interface AttractionPin {
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
}

export interface FoodSpotPin {
  name: string;
  description: string;
  lat: number;
  lng: number;
  cuisine: string;
  priceRange: string;
}

export interface MapData {
  centerLat: number;
  centerLng: number;
  zoom: number;
  attractions: AttractionPin[];
  foodSpots: FoodSpotPin[];
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
  activities?: string[];
}

export interface DestinationContent {
  attractions: AttractionPin[];
  foodSpots: FoodSpotPin[];
  mapData?: MapData;
  startingPrice?: number;
  flightHours?: number;
  itinerary?: ItineraryItem[];
}

export interface DestinationRecord {
  id: string;
  name: string;
  country: string;
  styles: string[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather: string;
  content: DestinationContent;
  attractions?: AttractionPin[];
  foodSpots?: FoodSpotPin[];
  mapData?: MapData;
  createdAt: Date;
  updatedAt: Date;
}

export interface DestinationSummary {
  id: string;
  name: string;
  country: string;
  styles: string[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather: string;
}

export interface DestinationDetail extends DestinationSummary {
  content: DestinationContent;
}

export interface CreateDestinationInput {
  id: string;
  name: string;
  country: string;
  styles: string[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  content: DestinationContent;
  currentWeather?: string;
}

export interface UpdateDestinationInput {
  name?: string;
  country?: string;
  styles?: string[];
  bestSeason?: string;
  imgUrl?: string;
  heroImageUrl?: string;
  content?: DestinationContent;
  currentWeather?: string;
}

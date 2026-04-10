export interface StyleRecord {
  id: string;
  slug: string;
  labelLt: string;
  icon: string | null;
  sortOrder: number;
}

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

export interface WeatherMonth {
  month: string;
  temp: number;
  rain: number;
  quality: 'ok' | 'good' | 'best';
}

export interface WhyItem {
  color: 'o' | 'b' | 'g';
  title: string;
  description: string;
}

export interface TagItem {
  text: string;
  color: string;
}

export interface EmergencyInfo {
  police: string;
  ambulance: string;
  embassy: string;
  code: string;
  note: string;
}

export interface DestinationRecord {
  id: string;
  name: string;
  country: string;
  tagline: string;
  styles: StyleRecord[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  imgFileId: string | null;
  heroImageFileId: string | null;
  currentWeather: string;
  description: string;
  highlights: string[];
  flightHours: number | null;
  minDailyBudget: number | null;
  startingPrice: number | null;
  soldCount: number;
  weatherData: WeatherMonth[];
  whyData: WhyItem[];
  compareData: { without: string[]; with: string[] };
  tipsHtml: string | null;
  emergencyData: EmergencyInfo;
  tagsData: TagItem[];
  photos: string[];
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DestinationSummary {
  id: string;
  name: string;
  country: string;
  tagline: string;
  styles: StyleRecord[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather: string;
}

export interface DestinationDetail extends DestinationSummary {
  description: string;
  highlights: string[];
  flightHours: number | null;
  minDailyBudget: number | null;
  startingPrice: number | null;
  soldCount: number;
  weatherData: WeatherMonth[];
  whyData: WhyItem[];
  compareData: { without: string[]; with: string[] };
  tipsHtml: string | null;
  emergencyData: EmergencyInfo;
  tagsData: TagItem[];
}

export interface DestinationSearchResult {
  id: string;
  name: string;
  country: string;
  styles: StyleRecord[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather: string;
  minDailyBudget: number | null;
  flightHours: number | null;
  startingPrice: number | null;
}

export interface CreateDestinationInput {
  id: string;
  name: string;
  country: string;
  styles: string[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather?: string;
  description?: string;
  highlights?: string[];
  flightHours?: number;
  minDailyBudget?: number;
  startingPrice?: number;
  soldCount?: number;
  weatherData?: WeatherMonth[];
  whyData?: WhyItem[];
  compareData?: { without: string[]; with: string[] };
  tipsHtml?: string;
  emergencyData?: EmergencyInfo;
  tagsData?: TagItem[];
}

export interface UpdateDestinationInput {
  name?: string;
  country?: string;
  styles?: string[];
  bestSeason?: string;
  imgUrl?: string;
  heroImageUrl?: string;
  currentWeather?: string;
  description?: string;
  highlights?: string[];
  flightHours?: number;
  minDailyBudget?: number;
  startingPrice?: number;
  soldCount?: number;
  weatherData?: WeatherMonth[];
  whyData?: WhyItem[];
  compareData?: { without: string[]; with: string[] };
  tipsHtml?: string;
  emergencyData?: EmergencyInfo;
  tagsData?: TagItem[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

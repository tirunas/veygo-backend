import type { Itinerary } from '../itineraries/itineraries.types';

export interface ReadyPlanSummary {
  id: string;
  itineraryId: string;
  title: string;
  subtitle: string;
  price: number;
  imgUrl: string;
  badge: string | null;
  tags: string[];
  isPublished: boolean;
  destinations: string[];
  totalDays: number;
}

export interface ReadyPlan extends ReadyPlanSummary {
  itinerary: Itinerary;
}

export interface CreateReadyPlanInput {
  id: string;
  itineraryId: string;
  title: string;
  subtitle: string;
  price: number;
  imgUrl: string;
  badge?: string;
  tags?: string[];
}

export interface UpdateReadyPlanInput {
  title?: string;
  subtitle?: string;
  price?: number;
  imgUrl?: string;
  badge?: string;
  tags?: string[];
}

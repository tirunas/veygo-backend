export interface ItinerarySegment {
  id: string;
  itineraryId: string;
  destinationId: string;
  order: number;
  days: unknown[];
  costs: ItineraryCosts;
}

export interface ItineraryCosts {
  flights: number;
  hotel: number;
  food: number;
  transport: number;
  activities: number;
}

export interface Itinerary {
  id: string;
  title: string | null;
  days: unknown[];
  costs: ItineraryCosts;
  segments: ItinerarySegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItineraryInput {
  id?: string;
  title?: string;
  days?: unknown[];
  costs?: ItineraryCosts;
}

export interface UpdateItineraryInput {
  title?: string;
  days?: unknown[];
  costs?: ItineraryCosts;
}

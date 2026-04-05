import { PlanStatus } from '@prisma/client';
import type {
  ItineraryItem,
  AttractionPin,
  FoodSpotPin,
} from '../destinations/destinations.types';

export interface PlanCustomData {
  notes?: string;
  selectedActivities?: string[];
  travelDates?: {
    startDate: string;
    endDate: string;
  };
  groupSize?: number;
}

export interface UserPlanRecord {
  id: string;
  userId: string;
  destinationId: string;
  status: PlanStatus;
  customData: PlanCustomData;
  createdAt: Date;
  updatedAt: Date;
}

export interface BasePlan {
  destinationId: string;
  destinationName: string;
  country: string;
  itinerary: ItineraryItem[];
  attractions: AttractionPin[];
  foodSpots: FoodSpotPin[];
  startingPrice?: number;
  flightHours?: number;
}

export interface CreateUserPlanInput {
  userId: string;
  destinationId: string;
}

export interface UpdateUserPlanInput {
  customData: PlanCustomData;
}

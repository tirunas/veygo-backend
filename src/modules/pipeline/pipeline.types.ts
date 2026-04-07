export type PipelineJobStatus =
  | 'pending'
  | 'searching'
  | 'places'
  | 'enriching'
  | 'media'
  | 'ready'
  | 'failed';

export type PipelineItemStatus = 'pending' | 'approved' | 'rejected';

export type PipelineType = 'attraction' | 'restaurant';

export interface PipelineJobRecord {
  id: string;
  destinationId: string;
  type: PipelineType;
  status: PipelineJobStatus;
  errorMessage: string | null;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineItemRecord {
  id: string;
  jobId: string;
  status: PipelineItemStatus;
  googlePlaceId: string | null;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  openingHours: string | null;
  photos: string[];
  nameLt: string | null;
  descriptionLt: string | null;
  wowFacts: string[];
  hook: string | null;
  category: string | null;
  ticketInfo: string | null;
  bestTimeToVisit: string | null;
  travellerTips: string[];
  officialWebsite: string | null;
  bookingUrls: string[];
  youtubeLinks: string[];
  instagramLinks: string[];
  howToGetThere: string | null;
  bestPhotoSpot: string | null;
  insiderTip: string | null;
  hiddenNearby: string | null;
  avoidIfYou: string | null;
  uniquenessScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerPipelineDto {
  destinationId: string;
  type: PipelineType;
}

export interface UpdateItemDto {
  nameLt?: string;
  descriptionLt?: string;
  hook?: string;
}

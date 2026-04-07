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
  youtubeLinks: string[];
  instagramLinks: string[];
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

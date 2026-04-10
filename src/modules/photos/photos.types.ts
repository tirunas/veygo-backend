export type PhotoEntityType = 'Destination' | 'Attraction' | 'Restaurant' | 'Hotel';

export interface Photo {
  id: string;
  url: string;
  filename: string;
  entityType: PhotoEntityType;
  entityId: string;
  isPrimary: boolean;
  sortOrder: number;
  alt: string | null;
  createdAt: Date;
}

export interface ReorderPhotosInput {
  orderedIds: string[];
}

export interface UpdatePhotoInput {
  alt?: string;
}

export interface ExperienceContent {
  gallery?: string[];
  description?: string;
  highlights?: string[];
  insiderTip?: string;
  bestTime?: string;
}

export interface Experience {
  id: string;
  destinationId: string | null;
  title: string;
  subtitle: string;
  category: string;
  heroImgUrl: string;
  price: string;
  duration: string;
  tags: string[];
  content: ExperienceContent;
}

export interface CreateExperienceInput {
  id: string;
  destinationId?: string;
  title: string;
  subtitle: string;
  category: string;
  heroImgUrl: string;
  price: string;
  duration: string;
  tags?: string[];
  content?: ExperienceContent;
}

export interface UpdateExperienceInput {
  destinationId?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  heroImgUrl?: string;
  price?: string;
  duration?: string;
  tags?: string[];
  content?: ExperienceContent;
}

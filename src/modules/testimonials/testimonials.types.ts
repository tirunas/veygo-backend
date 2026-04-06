export interface Testimonial {
  id: string;
  text: string;
  author: string;
  city: string;
  initials: string;
  colorHex: string;
  destinationName: string | null;
  tripDate: string | null;
  highlight: string | null;
  savedAmount: string | null;
}

export interface CreateTestimonialInput {
  id: string;
  text: string;
  author: string;
  city: string;
  initials: string;
  colorHex: string;
  destinationName?: string;
  tripDate?: string;
  highlight?: string;
  savedAmount?: string;
}

export interface UpdateTestimonialInput {
  text?: string;
  author?: string;
  city?: string;
  initials?: string;
  colorHex?: string;
  destinationName?: string;
  tripDate?: string;
  highlight?: string;
  savedAmount?: string;
}

import { z } from 'zod';

export const searchDestinationsSchema = z.object({
  q: z.string().optional(),
  styles: z.string().optional(), // comma-separated: "culture,food"
  maxBudget: z.coerce.number().min(0).optional(),
  maxFlightH: z.coerce.number().min(0).optional(),
  months: z.string().optional(), // comma-separated Lithuanian month names: "Sausis,Vasaris"
  weather: z.enum(['warm', 'cool']).optional(),
});

export type SearchDestinationsDto = z.infer<typeof searchDestinationsSchema>;

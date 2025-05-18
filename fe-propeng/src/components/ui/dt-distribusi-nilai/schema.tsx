import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  mean: z.number(),
  score: z.number()
});

export type Schema = z.infer<typeof dataSchema>;

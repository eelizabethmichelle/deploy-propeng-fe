import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  role: z.string(),
  isActive: z.string(),
});

export type Schema = z.infer<typeof dataSchema>;

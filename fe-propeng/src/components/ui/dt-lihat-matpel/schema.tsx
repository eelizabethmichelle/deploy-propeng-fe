import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  nisn: z.string(),
  angkatan: z.string(),
  status: z.string(),
});

export type Schema = z.infer<typeof dataSchema>;

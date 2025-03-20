import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.number(),
  name: z.string(),
  kode: z.string(),
  status: z.string(),
  teacher: z.string(),
  tahunAjaran: z.union([z.number(), z.string()]),
  students: z.number(),
});

export type Schema = z.infer<typeof dataSchema>;

import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  angkatan: z.number(),
  status: z.string(),
  submissions_count: z.number(),
  matpel: z.object({
    tier1_option1: z.object({ nama: z.string() }),
    tier1_option2: z.object({ nama: z.string() }),
    tier2_option1: z.object({ nama: z.string() }),
    tier2_option2: z.object({ nama: z.string() }),
    tier3_option1: z.object({ nama: z.string() }),
    tier3_option2: z.object({ nama: z.string() }),
    tier4_option1: z.object({ nama: z.string() }),
    tier4_option2: z.object({ nama: z.string() }),
  }),
}); 


export type Schema = z.infer<typeof dataSchema>;
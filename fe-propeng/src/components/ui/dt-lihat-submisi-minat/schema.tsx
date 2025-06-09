import { z } from "zod";

export const dataSchema = z.object({
  id: z.number(),
  siswa: z.string(),
  submittedAt: z.string(),
  status: z.string(),
});


export type Schema = z.infer<typeof dataSchema>;

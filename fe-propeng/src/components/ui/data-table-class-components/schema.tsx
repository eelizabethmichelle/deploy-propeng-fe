import { z } from "zod";

// Definisi schema data
export const dataSchema = z.object({
  id: z.string(),
  namaKelas: z.string(),
  tahunAjaran: z.string(),
  waliKelas: z.string(),
  totalSiswa: z.string(),
  status: z.string(),
});

export type Schema = z.infer<typeof dataSchema>;

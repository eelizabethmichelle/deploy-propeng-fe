import { z } from "zod";

export const dataSchema = z.object({
  id: z.number(),
  namaSiswa: z.string(),
  rerataNilai: z.number(),
  nilaiPengetahuan: z.number(),
  nilaiKeterampilan: z.number(),
});

export type Schema = z.infer<typeof dataSchema>;

import { z } from "zod";

export const dataSchema = z.object({
  id: z.number(),
  namaMataPelajaran: z.string(),
  jumlahSiswa: z.number(),
  rerataNilai: z.number(),
  distribusiNilai: z.object({
    a: z.number(),
    b: z.number(),
    c: z.number(),
    d: z.number(),
  }),
});

export type Schema = z.infer<typeof dataSchema>;

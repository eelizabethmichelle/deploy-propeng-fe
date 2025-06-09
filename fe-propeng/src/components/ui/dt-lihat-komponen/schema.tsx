import { z } from "zod";

export const dataSchema = z.object({
  namaKomponen: z.string(),
  bobotKomponen: z.number(),
});

export type Schema = z.infer<typeof dataSchema>;

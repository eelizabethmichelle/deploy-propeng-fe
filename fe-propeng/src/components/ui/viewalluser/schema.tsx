import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const schema = z.object({
  name: z.string(),
  nisn: z.number(),
  username: z.string(),
  tahunAjaran: z.number(),
  category: z.string(),
});

export type Schema = z.infer<typeof schema>;

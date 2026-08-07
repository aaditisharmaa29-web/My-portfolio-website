import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
  }),
});

export const collections = { projects };

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Files starting with "_" (like _template.mdx) are ignored
const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    role: z.string().optional(),
    stack: z.array(z.string()).optional(),
    // Optional cover image, path under /public (e.g. "/projects/my-project/cover.png")
    cover: z.string().optional(),
    links: z
      .object({
        github: z.url().optional(),
        paper: z.url().optional(),
        demo: z.url().optional(),
        huggingface: z.url().optional(),
        colab: z.url().optional(),
        slides: z.url().optional(),
        video: z.url().optional(),
      })
      .default({}),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  }),
});

export const collections = { projects };

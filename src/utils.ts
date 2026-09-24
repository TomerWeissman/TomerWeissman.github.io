import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

// Drafts show up in `npm run dev` but never in the production build
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection("projects", ({ data }) => !(import.meta.env.PROD && data.draft));
  return projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

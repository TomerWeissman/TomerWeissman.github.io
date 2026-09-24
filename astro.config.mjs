import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { site } from "./src/site.config.ts";

export default defineConfig({
  site: site.url,
  integrations: [mdx(), sitemap()],
  markdown: {
    // remark/rehype pipeline (instead of the default Sätteri) so KaTeX math works; MDX inherits it
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    // Mermaid blocks are left raw and rendered in the browser by src/scripts/mermaid.ts
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid", "math"] },
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
});

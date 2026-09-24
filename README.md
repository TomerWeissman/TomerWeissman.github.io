# ML Portfolio Site

Personal portfolio built with [Astro](https://astro.build). Static output, no database. Each project is one `.mdx` file.

## Run locally

```bash
npm install
npm run dev       # http://localhost:4321 (drafts visible)
npm run build     # production build into dist/ (drafts hidden)
npm run preview   # serve the production build
```

In Astro 7, `npm run dev` starts the server in the background. Use `npx astro dev stop` to stop it and `npx astro dev logs` to see its output.

## Add a project in 3 steps

1. Copy `src/content/projects/_template.mdx` to `src/content/projects/<slug>.mdx`. The filename becomes the URL: `/projects/<slug>/`.
2. Put images for the project in `public/projects/<slug>/` and reference them as `/projects/<slug>/image.png`.
3. Fill in the frontmatter, write the page, and set `draft: false` when it's ready. Set `featured: true` to show it on the home page.

If a frontmatter field is missing or misspelled, the build fails with a clear error. The schema is in `src/content.config.ts`.

### Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title`, `summary`, `date` | yes | `summary` is shown on cards and under the title |
| `tags` | no | Used for the filter on /projects |
| `featured`, `draft` | no | Both default to `false` |
| `role`, `stack` | no | Shown in the project header |
| `links` | no | `github`, `paper`, `demo`, `huggingface`, `colab`, `slides`, `video`, each rendered as a button |
| `metrics` | no | `[{ label, value }]`, shown as a strip of headline numbers |
| `cover` | no | Image used for social link previews |

### Building blocks (no imports needed)

```mdx
<Video src="https://youtu.be/..." caption="..." />          YouTube or Vimeo
<Figure src="/projects/x/fig.png" alt="..." caption="..." />  click to zoom
<Gallery images={[{ src, alt }, ...]} caption="..." columns={3} />
<Callout type="note | result | warning" title="...">...</Callout>
<Metrics items={[{ label: "RMSE", value: "18.2" }]} />
```

The page also supports:

- **Diagrams:** a fenced code block with the language `mermaid`. It follows light and dark mode.
- **Math:** `$inline$` and `$$ block $$` (KaTeX).
- **Code:** fenced code blocks, with syntax highlighting and a copy button.
- **Tables, quotes, lists:** standard Markdown.

`src/content/projects/example-project.mdx` is a draft that uses every block. Open it in `npm run dev` to see how each one looks.

## Personal details

Name, intro, links, bio, experience, and skills all live in `src/site.config.ts`.

## Deploy

**Live at https://tomerweissman.github.io.** Every push to `main` rebuilds and redeploys it through GitHub Actions (`.github/workflows/deploy.yml`). Deploys take about a minute; check the Actions tab if one fails.

The steps below are only needed if you move off GitHub Pages.

**Vercel:** push to GitHub, then go to vercel.com → Add New Project → import the repo. It detects Astro automatically. Every push to `main` redeploys.

**Netlify:** push to GitHub, then go to app.netlify.com → Add new site → import the repo. `netlify.toml` already sets the build command and output folder.

**Custom domain:** add it in the host's dashboard, then update `url` in `src/site.config.ts` and the `Sitemap:` line in `public/robots.txt`.

## Structure

```
src/
  site.config.ts          personal info (edit this)
  content.config.ts       project frontmatter schema
  content/projects/       one .mdx per project
  components/             header, footer, hero, project rows
  components/mdx/         Video, Figure, Gallery, Callout, Metrics
  layouts/                BaseLayout (SEO, theme), ProjectLayout
  pages/                  /, /projects, /projects/[slug], /about, 404
  scripts/                hero canvas effect, project page enhancements
  styles/global.css       design tokens (colors live at the top)
public/                   favicon, social image, project assets
mockups/                  static HTML design mockups (not part of the build)
```

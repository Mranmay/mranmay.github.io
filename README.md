# Mranmay Shetty

Academic portfolio at [mranmay.github.io](https://mranmay.github.io). Astro generates static pages, with publications on the homepage and dedicated research, CV, and blog pages. Use the existing GitHub Pages workflow to deploy by merging into `main`.

## Develop

Use Node 20.19 or later. Install the locked dependencies with `npm ci`, run `npm run dev` for a local preview, and run `npm run build` to generate `dist/`.

## Add a post on GitHub

1. Under `src/content/blog/`, create `my-post.md`. The filename becomes `/blog/my-post/`.
2. Start with the frontmatter below. Dates use YYYY-MM-DD. Add ordinary Markdown below it.
3. Upload images to `public/images/posts/my-post/`. Reference their public paths and describe each image for readers using a screen reader.
4. Commit the post and its images on a branch, then merge the pull request. The blog index, latest writing, RSS feed, and sitemap are generated automatically.

```md
---
title: "A title for the post"
description: "One sentence about the question the post explores."
pubDate: 2026-11-23
author: "Mranmay Shetty"
tags: [neuroscience]
---

Write the post here.

![Description of the plotted result](/images/posts/my-post/figure.webp)
```

For a caption, use `<figure><img src="/images/posts/my-post/figure.webp" alt="Description of the plot" loading="lazy" /><figcaption>What to notice in the figure.</figcaption></figure>`. Optional frontmatter fields are `updatedDate`, `heroImage`, and `heroImageAlt`. Use `$…$` for inline math and `$$` on its own lines for display equations.

For an interactive figure, use a `.mdx` extension, import an Astro component below the frontmatter, and insert it in the text. The existing dynamical-systems post demonstrates this with `RecoveryFigure.astro`.

## Update the portfolio

Edit project descriptions in `src/data/projects.ts`, the homepage introduction in `src/components/Hero.astro`, the biography in `src/pages/about.astro`, CV entries in `src/pages/cv.astro`, and publications in `src/components/Publications.astro`.

## Homepage neuron data

The homepage displays 46 neighboring mouse visual cortex neurons from the MICrONS Consortium’s `minnie65` materialization v1300. Each cell in `src/data/microns-volume.json` has its original segment ID. Its source SWC file is available at `https://storage.googleapis.com/microns-static-links/skel/swc/dendrite/<id>.swc`. This release contains dendritic skeletons with axons excluded. [MICrONS Explorer](https://www.microns-explorer.org/) · [Static data documentation](https://tutorial.microns-explorer.org/static-repositories.html)

The display uses a spatial neighborhood from a sample of single-root SWC files. Polylines were simplified between branch points and short terminal twigs were omitted. A shared translation and uniform scale preserve the cells’ relative positions. The coordinates were rounded for display. Colors distinguish neighboring cells. The moving pulses are simulated.

MICrONS Consortium et al., “Functional connectomics spanning multiple areas of mouse visual cortex,” *Nature* **640**, 435–447 (2025). Adapted under the Creative Commons Attribution 4.0 International license. [Paper](https://doi.org/10.1038/s41586-025-08790-w) · [License](https://creativecommons.org/licenses/by/4.0/) · [MICrONS citation policy](https://www.microns-explorer.org/citation-policy)

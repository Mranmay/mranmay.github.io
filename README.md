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

Edit project descriptions in `src/data/projects.ts`, the homepage introduction in `src/components/Hero.astro`, CV entries in `src/pages/cv.astro`, and publications in `src/data/papers.ts`.

## Homepage neuron data

The homepage displays 76 neighboring mouse visual cortex neurons from the MICrONS Consortium’s `minnie65` materialization v1300. The scene combines 54 dendrite-only skeletons with 22 proofread skeletons that also trace axons. Each record in `src/data/microns-volume.json` gives the segment ID and source collection for retrieving the original SWC at `https://storage.googleapis.com/microns-static-links/skel/swc/<source>/<id>.swc`. [MICrONS Explorer](https://www.microns-explorer.org/) · [Static data documentation](https://tutorial.microns-explorer.org/static-repositories.html)

The scene samples single-root skeletons by soma proximity to a common tissue region. A shared translation and scale retain the original three-dimensional arrangement. The display preserves dendritic forks and terminal branches, simplifies the curves between them, and crops axons where they leave the displayed volume. Rounding the display coordinates and encoding successive steps keeps the 7,014 branch segments compact. The colors distinguish neighboring cells. The moving signals are simulated.

The 76 soma surfaces in `src/data/microns-somata.json` come from the matching static segmentation mesh (`gs://iarpa_microns/minnie/minnie65/seg_m1300`, level of detail 2). For each segment ID, the display uses the largest connected membrane patch within 2.1 SWC soma radii of the root, with a minimum crop radius of 12.5 µm. This includes the cell body and the starts of its processes. The patches were reduced to about 174 triangles per soma, oriented outward, and encoded relative to the measured soma position. [MICrONS mesh documentation](https://tutorial.microns-explorer.org/quickstart_notebooks/06-cloudvolume-download-mesh.html)

MICrONS Consortium et al., “Functional connectomics spanning multiple areas of mouse visual cortex,” *Nature* **640**, 435–447 (2025). Adapted under the Creative Commons Attribution 4.0 International license. [Paper](https://doi.org/10.1038/s41586-025-08790-w) · [License](https://creativecommons.org/licenses/by/4.0/) · [MICrONS citation policy](https://www.microns-explorer.org/citation-policy)
